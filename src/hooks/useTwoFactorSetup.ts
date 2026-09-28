import { useCallback, useEffect, useRef, useState } from 'react';
import {
  enableTwoFactor,
  getTwoFactorStatus,
  isTwoFactorAlreadyEnabledError,
  setupTwoFactor,
} from '@/src/lib/api/auth';
import { writeTwoFactorFlag } from '@/src/lib/twoFactorState';
import { useUserStore } from '@/src/lib/stores/userStore';

/**
 * Drives TOTP enrolment: fetches the provisioning URI on mount, then exchanges
 * a user-entered code for the recovery-code set.
 *
 * Shared by the native and web setup screens so the two stay in lock-step.
 */
export function useTwoFactorSetup() {
  const userId = useUserStore((state) => state.user_id);

  const [provisioningUri, setProvisioningUri] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  /** True when the account already has 2FA on, so there is nothing to set up. */
  const [alreadyEnabled, setAlreadyEnabled] = useState(false);

  // Each `/2fa/setup` call issues a *new* secret server-side. Two overlapping
  // calls (a remount, or StrictMode double-invoking the effect) could leave the
  // QR on screen out of step with the secret the server stores, so every code
  // the user typed would be rejected. Only one call may be in flight.
  const setupInFlight = useRef(false);

  const loadSetup = useCallback(async () => {
    if (setupInFlight.current) return;
    setupInFlight.current = true;

    setLoading(true);
    setErrorMessage('');
    try {
      // Calling setup while 2FA is on silently turns it OFF on the backend
      // (it overwrites the secret and resets totp_enabled). Check first.
      const status = await getTwoFactorStatus();
      if (status === true) {
        setAlreadyEnabled(true);
        await writeTwoFactorFlag(userId, true);
        return;
      }

      const response = await setupTwoFactor();
      setProvisioningUri(response.provisioning_uri);
      setSecret(response.secret);
    } catch (error: any) {
      if (isTwoFactorAlreadyEnabledError(error?.message)) {
        setAlreadyEnabled(true);
        await writeTwoFactorFlag(userId, true);
        return;
      }
      setErrorMessage(error?.message || 'Could not start two-factor setup.');
    } finally {
      setLoading(false);
      setupInFlight.current = false;
    }
  }, [userId]);

  useEffect(() => {
    loadSetup();
  }, [loadSetup]);

  // Clear a stale error as soon as the user starts correcting the code.
  useEffect(() => {
    if (code) setErrorMessage('');
  }, [code, userId]);

  /** Returns the recovery codes on success, or null when activation failed. */
  const activate = useCallback(async (): Promise<string[] | null> => {
    const trimmed = code.trim();

    if (trimmed.length !== 6 || !/^\d{6}$/.test(trimmed)) {
      setErrorMessage('Enter the 6-digit code from your authenticator app.');
      return null;
    }

    setActivating(true);
    setErrorMessage('');
    try {
      const response = await enableTwoFactor(trimmed);
      // The current session's is_2fa_verified flag cannot move until the next
      // sign-in, so persist the change for the Account Security toggle.
      await writeTwoFactorFlag(userId, true);
      return response.recovery_codes ?? [];
    } catch (error: any) {
      if (isTwoFactorAlreadyEnabledError(error?.message)) {
        setAlreadyEnabled(true);
        await writeTwoFactorFlag(userId, true);
        return null;
      }
      setErrorMessage(error?.message || 'That code was not accepted. Try again.');
      return null;
    } finally {
      setActivating(false);
    }
  }, [code, userId]);

  return {
    provisioningUri,
    secret,
    code,
    setCode,
    loading,
    activating,
    alreadyEnabled,
    errorMessage,
    setErrorMessage,
    activate,
    retry: loadSetup,
  };
}
