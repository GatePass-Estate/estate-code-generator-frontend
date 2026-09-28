import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import Back from '@/src/components/mobile/Back';
import CodeInput from '@/src/components/common/CodeInput';
import { sharedStyles } from '@/src/theme/styles';
import { fetchMe, recoverTwoFactor, verifyTwoFactor } from '@/src/lib/api/auth';
import { useAuthStore } from '@/src/lib/stores/authStore';
import { useAuth } from '@/src/hooks/useAuthContext';
import { broadcastLogin, storeAuthState } from '@/src/lib/helpers';
import { writeTwoFactorFlag } from '@/src/lib/twoFactorState';
import type { User } from '@/src/types/user';

export default function TwoFactorChallengeScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const params = useLocalSearchParams<{ two_fa_token?: string }>();
  const twoFaToken = params.two_fa_token ?? '';

  const [code, setCode] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [useRecovery, setUseRecovery] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (Platform.OS === 'web') document.title = 'Two-Factor Authentication - GatePass';
  }, []);

  // A challenge without its token cannot be completed; send the user back.
  useEffect(() => {
    if (!twoFaToken) router.replace('/auth/login');
  }, [twoFaToken, router]);

  useEffect(() => {
    if (errorMessage) setErrorMessage('');
    // Clear the error as soon as the user edits either field.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, recoveryCode]);

  const routeForUser = useCallback(
    (user: User) => {
      if (user.role === 'resident' || ['primary_admin', 'admin'].includes(user.role!)) {
        router.replace('/user');
      } else if (user.role === 'security') {
        router.replace('/security');
      } else {
        setErrorMessage('This account cannot sign in here.');
      }
    },
    [router]
  );

  const handleSubmit = useCallback(async () => {
    if (submitting) return;

    if (useRecovery) {
      if (!recoveryCode.trim()) {
        setErrorMessage('Enter one of your recovery codes.');
        return;
      }
    } else if (code.length !== 6) {
      setErrorMessage('Enter the 6-digit code from your authenticator app.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      const result = useRecovery
        ? await recoverTwoFactor(twoFaToken, recoveryCode.trim())
        : await verifyTwoFactor(twoFaToken, code);

      if (!result.access_token) {
        setErrorMessage('That code was not accepted. Try again.');
        setSubmitting(false);
        return;
      }

      // Terms may still be outstanding once the second factor clears.
      if (result.requires_tos_acceptance) {
        router.replace({
          pathname: '/auth/tos',
          params: { token: result.access_token, role: result.role || '' },
        });
        return;
      }

      const user = await fetchMe(result.access_token);

      // Completing a challenge is proof of the account's 2FA state: verifying
      // means it is on, while a recovery code disables it server-side.
      await writeTwoFactorFlag(user.user_id, !useRecovery);

      useAuthStore.setState({
        access_token: result.access_token,
        role: user.role,
        session_id: result.session_id ?? null,
      });
      await storeAuthState({
        access_token: result.access_token,
        role: user.role,
        session_id: result.session_id ?? null,
      });
      broadcastLogin(result.access_token, user.role);
      signIn(user);
      routeForUser(user);
    } catch (error: any) {
      setErrorMessage(error?.message || 'That code was not accepted. Try again.');
      setSubmitting(false);
    }
  }, [submitting, useRecovery, recoveryCode, code, twoFaToken, router, signIn, routeForUser]);

  return (
    <SafeAreaView
      style={[sharedStyles.container, sharedStyles.modalContainer, { backgroundColor: '#F6F7F7' }]}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <Back
        type="short-arrow"
        showText={false}
        showBorder
        onPress={() => router.replace('/auth/login')}
      />

      <Text className="text-primary font-ubuntu-medium mt-[18px]" style={{ fontSize: 27 }}>
        Two-Factor{'\n'}Authentication
      </Text>
      <Text className="text-[#0A1F29] font-inter-light text-sm mt-3 leading-5">
        {useRecovery
          ? 'Enter one of the recovery codes you saved when you turned on two-factor authentication.'
          : 'Enter the 6-digit code from your authenticator app to finish signing in.'}
      </Text>

      <View className="mt-12">
        {useRecovery ? (
          <TextInput
            value={recoveryCode}
            onChangeText={setRecoveryCode}
            placeholder="Enter a recovery code"
            placeholderTextColor="#878686"
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            className="bg-[#EFF1F1] rounded-[16px] h-12 px-5 text-sm font-inter-light text-[#0A1F29]"
          />
        ) : (
          <>
            <Text className="text-[#878686] font-inter-regular text-center text-[11px] mb-4">
              Please Enter Code
            </Text>
            <CodeInput value={code} onChange={setCode} onSubmit={handleSubmit} />
          </>
        )}
      </View>

      {!!errorMessage && (
        <Text className="text-danger font-inter-regular text-xs text-center mt-5">
          {errorMessage}
        </Text>
      )}

      <Pressable
        onPress={() => {
          setUseRecovery((value) => !value);
          setCode('');
          setRecoveryCode('');
        }}
        className="mt-6 self-center"
      >
        <Text className="text-primary font-ubuntu-regular text-xs underline">
          {useRecovery ? 'Use your authenticator app instead' : 'Use a recovery code instead'}
        </Text>
      </Pressable>

      <View className="flex-1" />

      <Pressable
        onPress={handleSubmit}
        disabled={submitting}
        className="bg-primary rounded-[24px] h-11 items-center justify-center mb-8"
        style={{ opacity: submitting ? 0.7 : 1 }}
      >
        {submitting ? (
          <ActivityIndicator color="#F6F7F7" />
        ) : (
          <Text className="text-[#F6F7F7] font-ubuntu-semibold text-sm">Submit</Text>
        )}
      </Pressable>
    </SafeAreaView>
  );
}
