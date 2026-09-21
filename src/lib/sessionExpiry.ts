/**
 * Bridge between the axios layer and the auth context.
 *
 * API calls happen outside React, so when the server tells us this session is
 * no longer valid the interceptor cannot sign the user out by itself. The auth
 * provider registers a handler here on mount and the interceptor calls it.
 */

type Handler = (reason: string) => void;

let handler: Handler | null = null;
/** Guards against a burst of parallel 401s each triggering a sign-out. */
let signalled = false;

export function registerSessionExpiredHandler(next: Handler | null): void {
  handler = next;
}

/** Call after a successful sign-in so a later revocation is acted on again. */
export function resetSessionExpirySignal(): void {
  signalled = false;
}

export function notifySessionExpired(reason: string): void {
  if (signalled || !handler) return;
  signalled = true;
  handler(reason);
}

/**
 * Detail strings the backend returns when the *session* (not the credentials)
 * is no longer usable. A wrong password also returns 401, so matching on the
 * message keeps us from signing people out of the login screen.
 */
const SESSION_INVALID_DETAILS = [
  'session has been revoked',
  'session has expired',
  'no session associated with this token',
  'invalid token: missing subject',
];

export function isSessionInvalidDetail(detail: unknown): boolean {
  if (typeof detail !== 'string') return false;
  const normalised = detail.trim().toLowerCase();
  return SESSION_INVALID_DETAILS.some((entry) => normalised.startsWith(entry));
}
