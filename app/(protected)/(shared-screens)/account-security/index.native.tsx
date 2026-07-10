import { View, Text, Pressable, Image, Switch, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
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
} from '@/src/lib/biometricAuth';
import { disableBiometricLogin, enableBiometricLogin } from '@/src/lib/api/auth';
import { useAuthStore } from '@/src/lib/stores/authStore';
import { useUserStore } from '@/src/lib/stores/userStore';

export default function AccountSecurityScreen() {
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  const { user_id, estate_id } = useUserStore();

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
        await clearBiometricPreference(user_id, estate_id);
        setBiometricEnabled(false);
      }
    },
    [user_id, estate_id]
  );

  if (Platform.OS === 'web') {
    return null;
  }

  return (
    <SafeAreaView style={[sharedStyles.container, sharedStyles.modalContainer]}>
      <Stack.Screen options={{ headerShown: false }} />
      <Back type="short-arrow" />

      <View className="flex-1">
        <Text
          className="text-[22px] text-primary mb-[15px] font-ubuntu-bold mt-[30px]"
          style={{ fontSize: 23 }}
        >
          Account Security
        </Text>
        <Text className="text-xs font-inter-medium text-[#172024] mb-[30px] leading-[14px]">
          Manage your security settings and update your password for quick secure access.
        </Text>

        <Pressable
          className="flex-row justify-between items-center gap-10 h-14 bg-[#F7F9F9] rounded-[8px] px-5"
          onPress={() => router.push('/profile/edit/password')}
        >
          <Text className="text-[15px] font-inter-regular  text-[#172024]">Change Password</Text>
          <Image source={icons.rightIcon} style={{ width: 14, height: 14 }} resizeMode="contain" />
        </Pressable>

        {biometricAvailable && (
          <View className="my-5">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-medium text-primary">SECURITY</Text>
            </View>

            <View className="mt-3 bg-transparent p-4 rounded-lg border-micro flex-row items-center justify-between">
              <Text className="text-base text-primary font-Inter">Biometric Login</Text>
              <Switch
                value={biometricEnabled}
                onValueChange={(nextValue) => {
                  void handleToggleBiometric(nextValue);
                }}
                trackColor={{ false: '#9B9797', true: '#113E55' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
