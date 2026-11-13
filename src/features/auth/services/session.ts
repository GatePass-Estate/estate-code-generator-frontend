/**
 * Session helpers for global auth expiry handling.
 * AuthProvider registers the logout callback; API clients invoke it on 401.
 */

import type { SignOutReason } from '@/src/features/auth/services/signOutReason';

type UnauthorizedHandler = (reason: SignOutReason) => void | Promise<void>;

let unauthorizedHandler: UnauthorizedHandler | null = null;
let handlingUnauthorized = false;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}

/**
 * Paths that may return 401 for bad credentials — do not force logout or try a
 * token refresh. The 2FA endpoints answer a wrong code with 401, and password
 * update does the same for a wrong current password. /auth/refresh reports its
 * own failures, and /auth/logout is best-effort during sign-out.
 */
const AUTH_EXEMPT_PATH =
  /\/auth\/(login|logout|refresh|forgot-password|reset-password|accept-tos|set-password|verify|biometric\/login|2fa\/(verify|recover|enable|disable|regenerate-codes))|\/users\/password\/update/i;

export function shouldForceLogoutOn401(requestUrl?: string): boolean {
  if (!requestUrl) return true;
  return !AUTH_EXEMPT_PATH.test(requestUrl);
}

/** Signs the user out (once) for a refused session; `reason` picks the login screen's notice. */
export async function handleUnauthorizedResponse(
  requestUrl?: string,
  reason: SignOutReason = 'ended'
): Promise<void> {
  if (!shouldForceLogoutOn401(requestUrl)) return;
  if (handlingUnauthorized) return;
  if (!unauthorizedHandler) return;

  handlingUnauthorized = true;
  try {
    await unauthorizedHandler(reason);
  } catch {
  } finally {
    setTimeout(() => {
      handlingUnauthorized = false;
    }, 1500);
  }
}
