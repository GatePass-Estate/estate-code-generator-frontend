/**
 * In-memory handoff for the short-lived tokens of a sign-in that is not finished yet: the 2FA
 * challenge token (login → two-factor) and the ToS-pending access token (login/two-factor → tos).
 *
 * Like recoveryCodes.ts, these are deliberately NOT router params: on web, params serialise into
 * the URL, and a bearer token in the address bar ends up in browser history, history sync and
 * server/proxy logs. They are never persisted either, so a page reload restarts sign-in.
 *
 * Screens read the value once into state (`peek…`) and clear it when they leave.
 */

let pendingTwoFactorToken: string | null = null;
let pendingTos: { token: string; role: string } | null = null;

export function setPendingTwoFactorToken(token: string): void {
  pendingTwoFactorToken = token;
}

export function peekPendingTwoFactorToken(): string | null {
  return pendingTwoFactorToken;
}

export function setPendingTos(token: string, role: string): void {
  pendingTos = { token, role };
}

export function peekPendingTos(): { token: string; role: string } | null {
  return pendingTos;
}

export function clearPendingTwoFactorToken(): void {
  pendingTwoFactorToken = null;
}

export function clearPendingTos(): void {
  pendingTos = null;
}
