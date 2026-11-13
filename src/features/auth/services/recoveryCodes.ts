/**
 * One-shot, in-memory handoff for freshly issued 2FA recovery codes.
 *
 * The codes are shown exactly once, immediately after enrolment. They are
 * deliberately NOT passed through router params: on web those serialise into
 * the URL (and therefore into browser history), and they are never persisted to
 * storage either. Reading them clears them, so a back-navigation or refresh
 * cannot resurface them.
 */

let pendingRecoveryCodes: string[] | null = null;

export function setPendingRecoveryCodes(codes: string[]): void {
  pendingRecoveryCodes = codes;
}

/** Returns the pending codes and clears them. Subsequent reads return null. */
export function consumePendingRecoveryCodes(): string[] | null {
  const codes = pendingRecoveryCodes;
  pendingRecoveryCodes = null;
  return codes;
}

export function clearPendingRecoveryCodes(): void {
  pendingRecoveryCodes = null;
}
