/**
 * Pure helpers shared by the Account Security, two-factor, Linked Devices and password screens
 * on web and native. No React, no I/O, so they are unit-tested directly.
 */

/** Which action the one-time-code prompt on Account Security is confirming. */
export type CodePromptMode = 'disable' | 'regenerate';

/** Keeps only digits and at most six of them, as an authenticator code field does. */
export function sanitizeTotpInput(raw: string): string {
  return raw.replace(/[^0-9]/g, '').slice(0, 6);
}

/** True for exactly six digits (surrounding whitespace ignored). */
export function isSixDigitCode(code: string): boolean {
  return /^\d{6}$/.test(code.trim());
}

/** Title, message and confirm label of the code prompt, identical on both platforms. */
export function codePromptCopy(mode: CodePromptMode | null) {
  const disabling = mode === 'disable';
  return {
    title: disabling ? 'Turn off two-factor authentication' : 'Regenerate recovery codes',
    message: disabling
      ? 'Enter the current code from your authenticator app to confirm.'
      : 'Enter the current code from your authenticator app. Your previous recovery codes will stop working.',
    confirmLabel: disabling ? 'Turn off' : 'Regenerate',
  };
}

/** True when the listed session is the one this device is signed in with. */
export function isCurrentSession(
  sessionId: string,
  currentSessionId: string | null | undefined
): boolean {
  return !!currentSessionId && sessionId === currentSessionId;
}

/** Validation for the web Change Password modal. Returns the error to show, or '' when valid. */
export function passwordChangeError({
  currentPassword,
  newPassword,
  confirmPassword,
}: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): string {
  if (newPassword !== confirmPassword) {
    return 'The new password and the confirm password do not match';
  }
  if (newPassword.length < 8 || currentPassword.length < 8) {
    return 'The password must be at least 8 characters long';
  }
  if (newPassword === currentPassword) {
    return 'The new password cannot be the same as the current password';
  }
  return '';
}

/** The session list after one device was logged out (other fields untouched). */
export function removeSession<T extends { items?: { id: string }[] | null }>(
  list: T,
  sessionId: string
): T {
  return { ...list, items: (list.items ?? []).filter((item) => item.id !== sessionId) };
}
