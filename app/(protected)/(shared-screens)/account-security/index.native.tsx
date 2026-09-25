import {
  View,
  Text,
  Pressable,
  Image,
  Switch,
  Platform,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useFocusEffect } from 'expo-router';
import Back from '@/src/components/mobile/Back';
import { sharedStyles } from '@/src/theme/styles';
import icons from '@/src/constants/icons';
import { useCallback, useEffect, useState } from 'react';
import {
  clearBiometricPreference,
  deleteBiometricToken,
  isBiometricAvailable,
  isBiometricPreferenceEnabled,
  promptBiometrics,
  saveBiometricCredentials,
  setBiometricPreference,
} from '@/src/lib/biometricAuth';
import {
  disableBiometricLogin,
  disableTwoFactor,
  enableBiometricLogin,
  isTwoFactorNotEnabledError,
  regenerateRecoveryCodes,
} from '@/src/lib/api/auth';
import { setPendingRecoveryCodes } from '@/src/lib/recoveryCodes';
import { useAuthStore } from '@/src/lib/stores/authStore';
import { useUserStore } from '@/src/lib/stores/userStore';
import { useTwoFactorStatus } from '@/src/hooks/useTwoFactorStatus';

export default function AccountSecurityScreen() {
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  const { user_id, estate_id } = useUserStore();
  const {
    enabled: twoFactorEnabled,
    setEnabled: setTwoFactorEnabled,
    refresh: refreshTwoFactor,
  } = useTwoFactorStatus();

  // One code prompt serves both actions that require a current TOTP code.
  const [codePrompt, setCodePrompt] = useState<'disable' | 'regenerate' | null>(null);
  const [promptCode, setPromptCode] = useState('');
  const [promptBusy, setPromptBusy] = useState(false);
  const [promptError, setPromptError] = useState('');

  // Re-read the status on focus so returning from setup shows the new state.
  useFocusEffect(
    useCallback(() => {
      refreshTwoFactor();
    }, [refreshTwoFactor])
  );

  useEffect(() => {
    let mounted = true;

    async function initBiometric() {
      const available = await isBiometricAvailable();
      if (!mounted) return;
      setBiometricAvailable(available);

      if (available) {
        const enabled = await isBiometricPreferenceEnabled(user_id, estate_id);
        if (!mounted) return;
        setBiometricEnabled(enabled);
      }
    }

    initBiometric();
    return () => {
      mounted = false;
    };
    // Re-check when the active user or estate changes.
  }, [user_id, estate_id]);

  const handleToggleBiometric = useCallback(
    async (value: boolean) => {
      setBiometricEnabled(value);

      if (value) {
        const available = await isBiometricAvailable();
        if (!available) {
          setBiometricEnabled(false);
          Alert.alert(
            'Biometric login not available',
            'Set up Face ID or Touch ID on this device first.'
          );
          return;
        }

        const success = await promptBiometrics('Enable biometric login');
        if (!success) {
          setBiometricEnabled(false);
          return;
        }

        const token = useAuthStore.getState().access_token;
        if (!token || !user_id) {
          setBiometricEnabled(false);
          return;
        }

        try {
          const biometricResponse = await enableBiometricLogin(token, estate_id);
          await saveBiometricCredentials(biometricResponse.biometric_token, user_id, estate_id);
          setBiometricEnabled(true);
        } catch (error: any) {
          setBiometricEnabled(false);
          Alert.alert('Unable to enable biometric login', error?.message || 'Please try again.');
        }
      } else {
        try {
          const token = useAuthStore.getState().access_token;
          if (token) {
            await disableBiometricLogin(token);
          }
        } catch {
          // Ignore disable errors and still clear locally stored biometrics.
        }
        await deleteBiometricToken();
        await setBiometricPreference(user_id, estate_id, false);
        await clearBiometricPreference(user_id, estate_id);
        setBiometricEnabled(false);
      }
    },
    [user_id, estate_id]
  );

  const openCodePrompt = useCallback((mode: 'disable' | 'regenerate') => {
    setPromptCode('');
    setPromptError('');
    setCodePrompt(mode);
  }, []);

  const handleToggleTwoFactor = useCallback(
    (value: boolean) => {
      if (value) {
        router.push('/account-security/two-factor');
        return;
      }
      // Turning 2FA off requires a current code, so collect one first.
      openCodePrompt('disable');
    },
    [openCodePrompt]
  );

  const submitCodePrompt = useCallback(async () => {
    const code = promptCode.trim();
    if (code.length !== 6) {
      setPromptError('Enter the 6-digit code from your authenticator app.');
      return;
    }

    setPromptBusy(true);
    setPromptError('');
    try {
      if (codePrompt === 'disable') {
        await disableTwoFactor(code);
        setTwoFactorEnabled(false);
        setCodePrompt(null);
        return;
      }

      const response = await regenerateRecoveryCodes(code);
      // Handed over in memory so the codes never reach the URL or history.
      setPendingRecoveryCodes(response.recovery_codes ?? []);
      setCodePrompt(null);
      router.push('/account-security/recovery-codes');
    } catch (error: any) {
      // The server says 2FA is already off (e.g. it was reset elsewhere). That
      // is the truth, not a failure: correct the toggle instead of erroring.
      if (isTwoFactorNotEnabledError(error?.message)) {
        setTwoFactorEnabled(false);
        setCodePrompt(null);
        return;
      }
      setPromptError(error?.message || 'That code was not accepted.');
    } finally {
      setPromptBusy(false);
    }
  }, [promptCode, codePrompt, setTwoFactorEnabled]);

  if (Platform.OS === 'web') {
    return null;
  }

  return (
    <SafeAreaView
      style={[sharedStyles.container, sharedStyles.modalContainer, { backgroundColor: '#F6F7F7' }]}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <Back type="short-arrow" showText={false} showBorder />

      <View className="flex-1">
        <Text className="text-primary font-ubuntu-medium mt-[18px]" style={{ fontSize: 27 }}>
          Account Security
        </Text>
        <Text className="text-[#0A1F29] font-inter-light text-sm mt-3 mb-7 leading-5">
          Manage your security settings and update your password for quick secure access.
        </Text>

        <Pressable
          className="flex-row justify-between items-center h-14 bg-[#EFF1F1] rounded-[8px] px-5"
          onPress={() => router.push('/profile/edit/password')}
        >
          <Text className="text-[15px] font-inter-light text-[#0A1F29]">Change Password</Text>
          <Image source={icons.rightIcon} style={{ width: 14, height: 14 }} resizeMode="contain" />
        </Pressable>

        {biometricAvailable && (
          <View className="flex-row justify-between items-center h-14 bg-[#EFF1F1] rounded-[8px] px-5 mt-4">
            <Text className="text-[15px] font-ubuntu-regular text-[#0A1F29]">
              Face ID &amp; Biometrics
            </Text>
            <Switch
              value={biometricEnabled}
              onValueChange={(nextValue) => {
                void handleToggleBiometric(nextValue);
              }}
              trackColor={{ false: '#9B9797', true: '#113E55' }}
              thumbColor="#FFFFFF"
            />
          </View>
        )}

        <Text className="text-[#3E424E] font-inter-regular text-[11px] mt-8 mb-3">
          Require an extra security when logging in.
        </Text>

        <View className="flex-row justify-between items-center h-14 bg-[#EFF1F1] rounded-[8px] px-5">
          <Text className="text-[15px] font-ubuntu-regular text-[#0A1F29]">
            Google Authenticator
          </Text>
          <Switch
            value={twoFactorEnabled}
            onValueChange={handleToggleTwoFactor}
            trackColor={{ false: '#9B9797', true: '#113E55' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {twoFactorEnabled && (
          <Pressable onPress={() => openCodePrompt('regenerate')} className="mt-4 self-start">
            <Text className="text-primary font-ubuntu-regular text-xs underline">
              Regenerate recovery codes
            </Text>
          </Pressable>
        )}
      </View>

      <Modal visible={codePrompt !== null} transparent animationType="fade">
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="w-full bg-white rounded-2xl p-5">
            <Text className="text-primary font-ubuntu-semibold text-lg mb-2">
              {codePrompt === 'disable'
                ? 'Turn off two-factor authentication'
                : 'Regenerate recovery codes'}
            </Text>
            <Text className="text-[#3E424E] font-inter-light text-sm mb-4 leading-5">
              {codePrompt === 'disable'
                ? 'Enter the current code from your authenticator app to confirm.'
                : 'Enter the current code from your authenticator app. Your previous recovery codes will stop working.'}
            </Text>

            <TextInput
              value={promptCode}
              onChangeText={(next) => setPromptCode(next.replace(/[^0-9]/g, '').slice(0, 6))}
              placeholder="6-digit code"
              placeholderTextColor="#878686"
              keyboardType="number-pad"
              maxLength={6}
              className="bg-[#EFF1F1] rounded-[16px] h-12 px-5 text-sm font-inter-light text-[#0A1F29]"
            />

            {!!promptError && (
              <Text className="text-danger font-inter-regular text-xs mt-3">{promptError}</Text>
            )}

            <View className="flex-row gap-3 mt-5">
              <Pressable
                onPress={() => {
                  if (!promptBusy) setCodePrompt(null);
                }}
                className="flex-1 h-11 rounded-[24px] bg-[#EFF1F1] items-center justify-center"
              >
                <Text className="text-primary font-ubuntu-semibold text-sm">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={submitCodePrompt}
                disabled={promptBusy}
                className="flex-1 h-11 rounded-[24px] bg-primary items-center justify-center"
                style={{ opacity: promptBusy ? 0.7 : 1 }}
              >
                <Text className="text-white font-ubuntu-semibold text-sm">
                  {promptBusy ? 'Working…' : codePrompt === 'disable' ? 'Turn off' : 'Regenerate'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
