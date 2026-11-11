/**
 * Why the app signed the user out on its own, so the login screen can say so accurately.
 *
 * - `inactive`: the refresh token ran out because the app wasn't used for a while (the user
 *   service issues 60-minute refresh tokens and answers "Refresh token has expired.").
 * - `expired`: the session reached the end of its lifetime ("Session has expired.").
 * - `ended`: the session no longer exists or was revoked: signed out from Linked Devices or "Log
 *   out of all devices", the account or estate was deactivated, or a security revocation.
 *
 * None of these on its own means someone else used the account, so the copy never claims that.
 */
export type SignOutReason = 'inactive' | 'expired' | 'ended';

const SIGN_OUT_REASONS: readonly SignOutReason[] = ['inactive', 'expired', 'ended'];

/** The `detail` a FastAPI error response carries, if it is a string. */
export function errorDetail(data: unknown): string {
  if (data && typeof data === 'object' && 'detail' in data) {
    const { detail } = data as { detail?: unknown };
    if (typeof detail === 'string') return detail;
  }
  return '';
}

/**
 * Reason for a refused `POST /auth/refresh`. `refreshTokenExpiresAt` (ms) is the stored refresh
 * token's own expiry, which identifies inactivity even if the server's wording changes.
 */
export function signOutReasonFromRefreshFailure(
  detail: string,
  refreshTokenExpiresAt: number | null,
  now: number = Date.now()
): SignOutReason {
  if (/refresh token has expired/i.test(detail)) return 'inactive';
  if (refreshTokenExpiresAt !== null && refreshTokenExpiresAt <= now) return 'inactive';
  if (/session has expired/i.test(detail)) return 'expired';
  return 'ended';
}

/**
 * Reason for an API request refused with 401 once refreshing can't help (gatepass_auth
 * `get_current_user`): "Session has expired." or "Token has expired" (an old session without a
 * refresh token) mean the sign-in ran out; anything else ("Session has been revoked.") ended it.
 */
export function signOutReasonFromRequestFailure(detail: string): SignOutReason {
  if (/session has expired|token has expired/i.test(detail)) return 'expired';
  return 'ended';
}

/** Login-screen notice for a sign-out the user didn't ask for. */
export function signOutNotice(reason: SignOutReason): string {
  switch (reason) {
    case 'inactive':
      return 'You were signed out after a period of inactivity. Please sign in again.';
    case 'expired':
      return 'Your sign-in has expired. Please sign in again.';
    case 'ended':
      return 'You were signed out because this session was ended. Please sign in again.';
  }
}

/** The `signed_out` route param, if it names a known reason. */
export function parseSignOutReason(value: unknown): SignOutReason | null {
  const raw = Array.isArray(value) ? value[0] : value;
  return SIGN_OUT_REASONS.includes(raw as SignOutReason) ? (raw as SignOutReason) : null;
}
