import { useCallback } from 'react';
import { Keyboard, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { CircleLoader } from '@/src/shared/components/feedback/ScreenLoading';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import BrandedQRCode from '@/src/shared/components/BrandedQRCode';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Back from '@/src/shared/components/navigation/Back';
import { sharedStyles } from '@/src/shared/theme/styles';
import { useTwoFactorSetup } from '@/src/features/auth/hooks/useTwoFactorSetup';
import { setPendingRecoveryCodes } from '@/src/features/auth/services/recoveryCodes';

export default function TwoFactorSetupScreen() {
  const {
    provisioningUri,
    secret,
    code,
    setCode,
    loading,
    activating,
    alreadyEnabled,
    errorMessage,
    activate,
    retry,
  } = useTwoFactorSetup();

  const handleCopySecret = useCallback(async () => {
    if (!secret) return;
    await Clipboard.setStringAsync(secret);
  }, [secret]);

  const handleActivate = useCallback(async () => {
    Keyboard.dismiss();
    const recoveryCodes = await activate();
    if (!recoveryCodes) return;

    // Hand the codes to the recovery screen out-of-band: they are shown once
    // and must not sit in navigation params/history.
    setPendingRecoveryCodes(recoveryCodes);
    router.replace('/account-security/recovery-codes');
  }, [activate]);

  return (
    <SafeAreaView
      style={[sharedStyles.container, sharedStyles.modalContainer, { backgroundColor: '#F6F7F7' }]}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <Back type="short-arrow" showText={false} showBorder />

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text className="mt-3 font-ubuntu-medium text-primary" style={{ fontSize: 27 }}>
          Set Up Two Factor{'\n'}Authentication
        </Text>
        <Text className="text-[#0A1F29] font-ubuntu-regular text-xs mt-3 leading-[18px]">
          Download Google Authenticator app on your google playstore or IOS Apps store. Scan or
          input the code below to activate.
        </Text>

        {loading ? (
          <View className="items-center py-14">
            <CircleLoader size={32} />
          </View>
        ) : alreadyEnabled ? (
          // Deliberately does not start setup: doing so while 2FA is on would
          // reset it server-side.
          <View className="items-center py-14">
            <Text className="text-[#0A1F29] font-inter-light text-sm text-center mb-5 leading-5">
              Two-factor authentication is already on for your account.
            </Text>
            <Pressable
              onPress={() => router.dismissTo('/account-security')}
              className="px-5 py-3 rounded-[24px] bg-primary"
            >
              <Text className="text-white font-ubuntu-semibold text-sm">
                Back to Account Security
              </Text>
            </Pressable>
          </View>
        ) : !provisioningUri ? (
          <View className="items-center py-14">
            <Text className="text-danger font-inter-regular text-sm text-center mb-4">
              {errorMessage || 'Could not start two-factor setup.'}
            </Text>
            <Pressable onPress={retry} className="px-5 py-3 rounded-[24px] bg-primary">
              <Text className="text-white font-ubuntu-semibold text-sm">Try again</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View className="items-center mt-8">
              <BrandedQRCode
                value={provisioningUri}
                size={220}
                backgroundColor="#F6F7F7"
                accessibilityLabel="Two-factor setup QR code"
              />

              <Pressable
                onPress={handleCopySecret}
                className="flex-row items-center gap-2 mt-5 active:opacity-70"
              >
                <Text className="text-[#3E424E] font-roboto-regular text-sm tracking-[1px]">
                  {secret}
                </Text>
                <MaterialCommunityIcons name="content-copy" size={18} color="#323232" />
              </Pressable>
            </View>

            <TextInput
              value={code}
              onChangeText={(next) => setCode(next.replace(/[^0-9]/g, '').slice(0, 6))}
              placeholder="Enter Code in your Authenticator App"
              placeholderTextColor="#878686"
              keyboardType="number-pad"
              inputMode="numeric"
              maxLength={6}
              returnKeyType="done"
              onSubmitEditing={handleActivate}
              className="bg-[#EFF1F1] rounded-[16px] h-12 px-5 mt-8 text-sm font-inter-light text-[#0A1F29]"
            />

            {!!errorMessage && (
              <Text className="text-danger font-inter-regular text-xs mt-3">{errorMessage}</Text>
            )}

            <Pressable
              onPress={handleActivate}
              disabled={activating}
              className="bg-primary rounded-[24px] h-11 items-center justify-center mt-10 mb-6"
              style={{ opacity: activating ? 0.7 : 1 }}
            >
              {activating ? (
                <CircleLoader size={22} tone="light" />
              ) : (
                <Text className="text-[#F6F7F7] font-ubuntu-semibold text-sm">Activate</Text>
              )}
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
