import { useCallback, useRef, useState, type ReactElement } from 'react';
import { BiometricPromptModal } from '@/src/features/auth/components/BiometricPromptModal';
import { dismissBiometricPrompt } from '@/src/features/auth/services/biometricAuth';
import {
  enableBiometricsFromPrompt,
  runPostSignInBiometrics,
} from '@/src/features/auth/services/postSignInBiometrics';
import type { User } from '@/src/features/users/types/user';

type PendingPrompt = { token: string; user: User; proceed: () => void };

/**
 * Wires the shared post-sign-in biometric step into a sign-in screen. Call `runPostSignIn` once
 * the session is established and render `biometricPromptModal` in the screen.
 *
 * `proceed` (usually the route change) runs after the biometric step finishes: immediately when
 * there is nothing to ask, or once the user answers the enable prompt.
 */
export function useBiometricSignInPrompt(): {
  /** Resolves `true` when the enable prompt was shown (so the screen should stop its loader). */
  runPostSignIn: (token: string, user: User, proceed: () => void) => Promise<boolean>;
  biometricPromptModal: ReactElement;
} {
  const [pending, setPending] = useState<PendingPrompt | null>(null);
  const busy = useRef(false);

  const runPostSignIn = useCallback(async (token: string, user: User, proceed: () => void) => {
    const outcome = await runPostSignInBiometrics(token, user);
    if (outcome === 'prompt') {
      setPending({ token, user, proceed });
      return true;
    }
    proceed();
    return false;
  }, []);

  const handleEnable = useCallback(async () => {
    if (!pending || busy.current) return;
    busy.current = true;
    const { token, user, proceed } = pending;
    try {
      await enableBiometricsFromPrompt(token, user);
    } finally {
      busy.current = false;
      setPending(null);
    }
    proceed();
  }, [pending]);

  const handleDismiss = useCallback(async () => {
    if (!pending || busy.current) return;
    busy.current = true;
    const { user, proceed } = pending;
    try {
      await dismissBiometricPrompt(user.user_id);
    } catch {
      // ignore storage errors
    } finally {
      busy.current = false;
      setPending(null);
    }
    proceed();
  }, [pending]);

  const biometricPromptModal = (
    <BiometricPromptModal
      visible={pending !== null}
      onEnable={handleEnable}
      onDismiss={handleDismiss}
    />
  );

  return { runPostSignIn, biometricPromptModal };
}
