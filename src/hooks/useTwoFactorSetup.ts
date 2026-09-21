import { useCallback, useEffect, useState } from 'react';
import { enableTwoFactor, setupTwoFactor } from '@/src/lib/api/auth';
import { setTwoFactorOverride } from '@/src/hooks/useTwoFactorStatus';

/**
 * Drives TOTP enrolment: fetches the provisioning URI on mount, then exchanges
 * a user-entered code for the recovery-code set.
 *
 * Shared by the native and web setup screens so the two stay in lock-step.
 */
export function useTwoFactorSetup() {
  const [provisioningUri, setProvisioningUri] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadSetup = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await setupTwoFactor();
      setProvisioningUri(response.provisioning_uri);
      setSecret(response.secret);
    } catch (error: any) {
      setErrorMessage(error?.message || 'Could not start two-factor setup.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSetup();
  }, [loadSetup]);

  // Clear a stale error as soon as the user starts correcting the code.
  useEffect(() => {
    if (code) setErrorMessage('');
  }, [code]);

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
      // sign-in, so record the change for the Account Security toggle.
      setTwoFactorOverride(true);
      return response.recovery_codes ?? [];
    } catch (error: any) {
      setErrorMessage(error?.message || 'That code was not accepted. Try again.');
      return null;
    } finally {
      setActivating(false);
    }
  }, [code]);

  return {
    provisioningUri,
    secret,
    code,
    setCode,
    loading,
    activating,
    errorMessage,
    setErrorMessage,
    activate,
    retry: loadSetup,
  };
}
