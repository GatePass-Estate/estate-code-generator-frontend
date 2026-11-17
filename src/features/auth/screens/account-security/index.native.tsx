import { View, Text, Pressable, Image, Platform, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import ToggleSwitch from '@/src/features/access-codes/components/ToggleSwitch';
import ActionConfirmModal from '@/src/shared/components/feedback/ActionConfirmModal';
import ScreenHeader from '@/src/shared/components/layout/ScreenHeader';
import { sharedStyles } from '@/src/shared/theme/styles';
import icons from '@/src/shared/constants/icons';
import { useAccountSecurity } from '@/src/features/auth/hooks/useAccountSecurity';
import { useBiometricLogin } from '@/src/features/auth/hooks/useBiometricLogin';

export default function AccountSecurityScreen() {
  const { biometricAvailable, biometricEnabled, handleToggleBiometric } = useBiometricLogin();
  const {
    twoFactorEnabled,
    handleToggleTwoFactor,
    codePrompt,
    codePromptCopy,
    openCodePrompt,
    closeCodePrompt,
    promptCode,
    setPromptCode,
    promptBusy,
    promptError,
    submitCodePrompt,
  } = useAccountSecurity();

  if (Platform.OS === 'web') {
    return null;
  }

  return (
    <SafeAreaView style={[sharedStyles.container, { backgroundColor: '#F6F7F7' }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader
        showBack
        title="Account Security"
        subtitle="Manage your security settings and update your password for quick secure access."
        subtitleClassName="font-inter-light text-sm leading-5 text-[#0A1F29]"
      />

      <View className="mt-7 flex-1">
        <Pressable
          className="h-14 flex-row items-center justify-between rounded-[8px] bg-[#EFF1F1] px-4"
          onPress={() => router.push('/profile/edit/password')}
        >
          <Text
            className="font-inter-light text-sm text-[#0A1F29]"
            style={{ lineHeight: 18, includeFontPadding: false }}
          >
            Change Password
          </Text>
          <Image source={icons.rightIcon} style={{ width: 14, height: 14 }} resizeMode="contain" />
        </Pressable>

        {biometricAvailable && (
          <View className="mt-4 h-14 flex-row items-center justify-between rounded-[8px] bg-[#EFF1F1] px-4">
            <Text
              className="font-inter-light text-sm text-[#0A1F29]"
              style={{ lineHeight: 18, includeFontPadding: false }}
            >
              Face ID &amp; Biometrics
            </Text>
            <ToggleSwitch
              value={biometricEnabled}
              onValueChange={(nextValue) => {
                void handleToggleBiometric(nextValue);
              }}
            />
          </View>
        )}

        <Text
          className="mb-3 mt-8 pl-[15px] font-inter-regular text-[11.2px] text-[#282A32]"
          style={{ lineHeight: 14, includeFontPadding: false }}
        >
          Require an extra security when logging in.
        </Text>

        <View className="h-14 flex-row items-center justify-between rounded-[8px] bg-[#EFF1F1] px-4">
          <Text
            className="font-ubuntu-regular text-[15px] text-[#0A1F29]"
            style={{ lineHeight: 18, includeFontPadding: false }}
          >
            Google Authenticator
          </Text>
          <ToggleSwitch value={twoFactorEnabled} onValueChange={handleToggleTwoFactor} />
        </View>

        {twoFactorEnabled && (
          <Pressable onPress={() => openCodePrompt('regenerate')} className="mt-4 self-start">
            <Text className="text-primary font-ubuntu-regular text-xs underline">
              Regenerate recovery codes
            </Text>
          </Pressable>
        )}
      </View>

      <ActionConfirmModal
        visible={codePrompt !== null}
        title={codePromptCopy.title}
        message={codePromptCopy.message}
        confirmLabel={codePromptCopy.confirmLabel}
        busy={promptBusy}
        onCancel={closeCodePrompt}
        onConfirm={submitCodePrompt}
      >
        <TextInput
          value={promptCode}
          onChangeText={setPromptCode}
          placeholder="6-digit code"
          placeholderTextColor="#878686"
          keyboardType="number-pad"
          maxLength={6}
          className="h-12 rounded-2xl bg-[#EFF1F1] px-5 text-sm font-inter-light text-[#0A1F29]"
        />
        {!!promptError && (
          <Text className="mt-3 text-center text-xs font-inter-regular text-danger">
            {promptError}
          </Text>
        )}
      </ActionConfirmModal>
    </SafeAreaView>
  );
}
