import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { errorMessage as thrownMessage } from '@/src/shared/services/api/errors';
import {
  disableTwoFactor,
  isTwoFactorNotEnabledError,
  regenerateRecoveryCodes,
} from '@/src/features/auth/services/auth';
import { setPendingRecoveryCodes } from '@/src/features/auth/services/recoveryCodes';
import { useTwoFactorStatus } from '@/src/features/auth/hooks/useTwoFactorStatus';
import {
  codePromptCopy,
  isSixDigitCode,
  sanitizeTotpInput,
  type CodePromptMode,
} from '@/src/features/auth/utils/accountSecurity';

/**
 * Account Security logic shared by the web and native screens: the 2FA status toggle and the
 * one-time-code prompt that confirms turning 2FA off or regenerating recovery codes.
 * Both actions are commands (service calls), not cached queries.
 */
export function useAccountSecurity() {
  const router = useRouter();
  const {
    enabled: twoFactorEnabled,
    setEnabled: setTwoFactorEnabled,
    refresh: refreshTwoFactor,
  } = useTwoFactorStatus();

  // One code prompt serves both actions that require a current TOTP code.
  const [codePrompt, setCodePrompt] = useState<CodePromptMode | null>(null);
  const [promptCode, setPromptCodeState] = useState('');
  const [promptError, setPromptError] = useState('');

  // Re-read the status on focus so returning from setup shows the new state.
  useFocusEffect(
    useCallback(() => {
      refreshTwoFactor();
    }, [refreshTwoFactor])
  );

  const openCodePrompt = useCallback((mode: CodePromptMode) => {
    setPromptCodeState('');
    setPromptError('');
    setCodePrompt(mode);
  }, []);

  const setPromptCode = useCallback((raw: string) => {
    setPromptCodeState(sanitizeTotpInput(raw));
  }, []);

  /** Turning 2FA on opens setup; turning it off needs a current code, so collect one first. */
  const handleToggleTwoFactor = useCallback(
    (value: boolean) => {
      if (value) {
        router.push('/account-security/two-factor');
        return;
      }
      openCodePrompt('disable');
    },
    [router, openCodePrompt]
  );

  const { mutateAsync: runCodeAction, isPending: promptBusy } = useMutation({
    mutationFn: async ({ mode, code }: { mode: CodePromptMode; code: string }) => {
      if (mode === 'disable') {
        await disableTwoFactor(code);
        return null;
      }
      const response = await regenerateRecoveryCodes(code);
      return response.recovery_codes ?? [];
    },
  });

  const submitCodePrompt = useCallback(async () => {
    const code = promptCode.trim();
    if (!codePrompt || !isSixDigitCode(code)) {
      setPromptError('Enter the 6-digit code from your authenticator app.');
      return;
    }

    setPromptError('');
    try {
      const recoveryCodes = await runCodeAction({ mode: codePrompt, code });
      if (codePrompt === 'disable') {
        setTwoFactorEnabled(false);
        setCodePrompt(null);
        return;
      }
      // Handed over in memory so the codes never reach the URL or history.
      setPendingRecoveryCodes(recoveryCodes ?? []);
      setCodePrompt(null);
      router.push('/account-security/recovery-codes');
    } catch (error: unknown) {
      // The server says 2FA is already off (e.g. it was reset elsewhere). That
      // is the truth, not a failure: correct the toggle instead of erroring.
      if (isTwoFactorNotEnabledError(thrownMessage(error))) {
        setTwoFactorEnabled(false);
        setCodePrompt(null);
        return;
      }
      setPromptError(thrownMessage(error) || 'That code was not accepted.');
    }
  }, [promptCode, codePrompt, runCodeAction, setTwoFactorEnabled, router]);

  const closeCodePrompt = useCallback(() => {
    if (!promptBusy) setCodePrompt(null);
  }, [promptBusy]);

  return {
    twoFactorEnabled,
    handleToggleTwoFactor,
    codePrompt,
    codePromptCopy: codePromptCopy(codePrompt),
    openCodePrompt,
    closeCodePrompt,
    promptCode,
    setPromptCode,
    promptBusy,
    promptError,
    submitCodePrompt,
  };
}
