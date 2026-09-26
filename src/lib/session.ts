/**
 * Session helpers for global auth expiry handling.
 * AuthProvider registers the logout callback; API clients invoke it on 401.
 */

type UnauthorizedHandler = () => void | Promise<void>;

let unauthorizedHandler: UnauthorizedHandler | null = null;
let handlingUnauthorized = false;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}

/** Paths that may return 401 for bad credentials — do not force logout. */
const AUTH_EXEMPT_PATH =
  /\/auth\/(login|forgot-password|reset-password|accept-tos|set-password|verify)/i;

export function shouldForceLogoutOn401(requestUrl?: string): boolean {
  if (!requestUrl) return true;
  return !AUTH_EXEMPT_PATH.test(requestUrl);
}

export async function handleUnauthorizedResponse(requestUrl?: string): Promise<void> {
  if (!shouldForceLogoutOn401(requestUrl)) return;
  if (handlingUnauthorized) return;
  if (!unauthorizedHandler) return;

  handlingUnauthorized = true;
  try {
    await unauthorizedHandler();
  } catch (error) {
    console.log('Error handling unauthorized session', error);
  } finally {
    setTimeout(() => {
      handlingUnauthorized = false;
    }, 1500);
  }
}
