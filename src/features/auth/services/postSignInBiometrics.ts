import { Platform } from 'react-native';
import { enableBiometricLogin } from '@/src/features/auth/services/auth';
import {
  biometricTokenMatchesUser,
  dismissBiometricPrompt,
  hasBiometricPromptBeenDismissed,
  isBiometricAvailable,
  isBiometricPreferenceEnabled,
  promptBiometrics,
  saveBiometricCredentials,
} from '@/src/features/auth/services/biometricAuth';
import type { User } from '@/src/features/users/types/user';

type SignedInUser = Pick<User, 'user_id' | 'estate_id'>;

/**
 * What the sign-in screen should do after a successful sign-in:
 * - `none`: nothing to show (biometrics unavailable, already handled silently, or the user
 *   already dismissed the prompt).
 * - `prompt`: show the one-time "Enable biometric login?" modal.
 */
export type PostSignInBiometricOutcome = 'none' | 'prompt';

/**
 * Shared post-sign-in biometric step for every sign-in path (password, 2FA, Terms of Service).
 *
 * - Web, or no biometrics on the device: nothing.
 * - Preference already on: silently re-bind a fresh biometric token to this session. No prompt of
 *   any kind (this is what makes login after a manual logout "just work").
 * - Preference off and the user never dismissed the prompt: ask to enable.
 *
 * Never throws; the sign-in itself must keep working if biometrics fail.
 */
export async function runPostSignInBiometrics(
  accessToken: string,
  user: SignedInUser
): Promise<PostSignInBiometricOutcome> {
  if (Platform.OS === 'web') return 'none';

  try {
    if (!(await isBiometricAvailable())) return 'none';

    if (await isBiometricPreferenceEnabled(user.user_id, user.estate_id)) {
      try {
        const response = await enableBiometricLogin(accessToken, user.estate_id);
        await saveBiometricCredentials(response.biometric_token, user.user_id, user.estate_id);
      } catch {
        // Keep the password flow working even if the silent re-bind fails.
      }
      return 'none';
    }

    if (await biometricTokenMatchesUser(user.user_id, user.estate_id)) return 'none';
    if (await hasBiometricPromptBeenDismissed(user.user_id)) return 'none';
    return 'prompt';
  } catch {
    return 'none';
  }
}

/**
 * The user accepted the enable prompt: confirm with Face ID / fingerprint, then bind a biometric
 * token. A cancelled or failed confirmation counts as a dismissal so the user isn't nagged.
 */
export async function enableBiometricsFromPrompt(
  accessToken: string,
  user: SignedInUser
): Promise<boolean> {
  try {
    if (!(await promptBiometrics('Enable biometric login'))) {
      await dismissBiometricPrompt(user.user_id);
      return false;
    }
    const response = await enableBiometricLogin(accessToken, user.estate_id);
    await saveBiometricCredentials(response.biometric_token, user.user_id, user.estate_id);
    return true;
  } catch {
    await dismissBiometricPrompt(user.user_id).catch(() => {});
    return false;
  }
}
