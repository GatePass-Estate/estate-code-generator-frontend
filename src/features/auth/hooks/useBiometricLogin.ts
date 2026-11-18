import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { errorMessage as thrownMessage } from '@/src/shared/services/api/errors';
import {
  clearBiometricPreference,
  deleteBiometricToken,
  isBiometricAvailable,
  isBiometricPreferenceEnabled,
  promptBiometrics,
  saveBiometricCredentials,
  setBiometricPreference,
} from '@/src/features/auth/services/biometricAuth';
import { disableBiometricLogin, enableBiometricLogin } from '@/src/features/auth/services/auth';
import { getValidAccessToken } from '@/src/features/auth/services/authRefresh';
import { useUserStore } from '@/src/store/userStore';

/**
 * Face ID / Touch ID sign-in toggle (native Account Security). Availability and the saved
 * preference are device state, not server data, so they are read directly rather than cached.
 */
export function useBiometricLogin() {
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  const user_id = useUserStore((s) => s.user_id);
  const estate_id = useUserStore((s) => s.estate_id);

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

        const token = await getValidAccessToken();
        if (!token || !user_id) {
          setBiometricEnabled(false);
          return;
        }

        try {
          const biometricResponse = await enableBiometricLogin(token, estate_id);
          await saveBiometricCredentials(biometricResponse.biometric_token, user_id, estate_id);
          setBiometricEnabled(true);
        } catch (error: unknown) {
          setBiometricEnabled(false);
          Alert.alert(
            'Unable to enable biometric login',
            thrownMessage(error) || 'Please try again.'
          );
        }
      } else {
        // Turning biometric login off is a security-sensitive change, so confirm with
        // Face ID / fingerprint first. If the device no longer has biometrics enrolled,
        // there is nothing to verify against, so let the user turn it off.
        const available = await isBiometricAvailable();
        if (available) {
          const confirmed = await promptBiometrics('Turn off biometric login');
          if (!confirmed) {
            setBiometricEnabled(true);
            return;
          }
        }

        try {
          const token = await getValidAccessToken();
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

  return { biometricAvailable, biometricEnabled, handleToggleBiometric };
}
