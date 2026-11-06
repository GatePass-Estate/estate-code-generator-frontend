/**
 * Access-token refresh.
 *
 * The user service issues a 30-minute access JWT and a refresh JWT that rotates on every
 * use. Presenting an already-used refresh token makes the backend treat it as stolen and
 * delete the whole session, so a refresh must never run twice with the same token: within
 * this JS context one in-flight promise is shared, and on web the browser tabs (which share
 * localStorage) take turns through a Web Lock and adopt a pair another tab already rotated.
 *
 * Backend contract (user_profile_service, endpoints/auth.py + services/auth.py):
 *   POST /api/v1/auth/refresh { refresh_token } -> LoginResponse with a new access_token and
 *   refresh_token, or 401 (expired, invalid, session gone, or reuse detected).
 */
import axios, { isAxiosError } from 'axios';
import { Platform } from 'react-native';
import { getAuthState, storeAuthState } from './helpers';
import { handleUnauthorizedResponse } from './session';
import { useAuthStore, type AuthState } from './stores/authStore';
import { attachDeviceId } from './deviceId';
import type { UserRolesType } from '../types/general';

export type SessionTokens = {
  access_token: string;
  refresh_token?: string | null;
  role: UserRolesType;
  session_id?: string | null;
};

/** Refresh this long before the access token's `exp`, so a request never leaves with a dead token. */
const EXPIRY_MARGIN_MS = 60_000;
/**
 * A token this young is never refreshed proactively. Guards against a device clock running
 * ahead of the server, which would otherwise make every fresh token look expired and rotate
 * the pair on every request. A wrong guess here only means waiting for the reactive 401 path.
 */
const MIN_PROACTIVE_AGE_MS = 5 * 60_000;
const REFRESH_TIMEOUT_MS = 10_000;
const LOGOUT_TIMEOUT_MS = 5_000;
const WEB_LOCK_NAME = 'gatepass-auth-refresh';
/** Older access tokens of the current session still count as "ours" for this many rotations. */
const MAX_SUPERSEDED = 5;

/** Plain client: no auth interceptors, so the refresh and logout calls can never recurse. */
const bareClient = axios.create();
bareClient.interceptors.request.use(attachDeviceId);

export class RefreshError extends Error {
  /** True when the server rejected the refresh token; the session cannot be recovered. */
  readonly definitive: boolean;

  constructor(message: string, definitive: boolean) {
    super(message);
    this.name = 'RefreshError';
    this.definitive = definitive;
  }
}

let inFlight: Promise<string> | null = null;
/** A refresh token the server already rejected; never send it again. */
let rejectedRefreshToken: string | null = null;
/** Access tokens this session rotated away from, so requests built with them get the new one. */
const supersededAccessTokens: string[] = [];
/** When the current access token was received in this JS context (0 = unknown, e.g. restored). */
let accessTokenReceivedAt = 0;

const userServiceUrl = () => process.env.EXPO_PUBLIC_USER_SERVICE_API_URL;

function decodeBase64Url(segment: string): string | null {
  // Hermes ships atob (checked in the hermesvm framework); fall back to "unknown" without it.
  const decode = (globalThis as { atob?: (data: string) => string }).atob;
  if (typeof decode !== 'function') return null;
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  return decode(base64 + '='.repeat((4 - (base64.length % 4)) % 4));
}

/** The JWT's `exp` in milliseconds, or null when it cannot be read. Signature is not checked. */
export function getTokenExpiryMs(token: string | null | undefined): number | null {
  const payload = token?.split('.')[1];
  if (!payload) return null;
  try {
    const json = decodeBase64Url(payload);
    const exp = json ? JSON.parse(json)?.exp : null;
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isTokenExpiringSoon(token: string | null | undefined, now = Date.now()): boolean {
  const expiry = getTokenExpiryMs(token);
  return expiry !== null && expiry - now <= EXPIRY_MARGIN_MS;
}

/** The current access token, or one this session replaced (a request may have been built with it). */
export function isOwnAccessToken(token: string | null | undefined): boolean {
  if (!token) return false;
  return token === useAuthStore.getState().access_token || supersededAccessTokens.includes(token);
}

function setStoreTokens(next: AuthState, rotation: boolean) {
  const previous = useAuthStore.getState().access_token;
  if (!rotation) supersededAccessTokens.length = 0;
  else if (previous && previous !== next.access_token) {
    supersededAccessTokens.push(previous);
    if (supersededAccessTokens.length > MAX_SUPERSEDED) supersededAccessTokens.shift();
  }
  if (previous !== next.access_token) accessTokenReceivedAt = Date.now();
  useAuthStore.setState(next);
}

function toAuthState(tokens: SessionTokens): AuthState {
  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? null,
    role: tokens.role,
    session_id: tokens.session_id ?? null,
  };
}

/**
 * Makes `tokens` the signed-in session: updates the store and persists it. Every sign-in
 * path (password, biometric, 2FA, ToS) goes through here.
 */
export async function applySession(tokens: SessionTokens): Promise<void> {
  const next = toAuthState(tokens);
  setStoreTokens(next, false);
  await storeAuthState(next);
}

/**
 * Loads a session that is already persisted (startup, or another tab signed in) into the
 * store without writing it back.
 */
export function adoptStoredSession(stored: AuthState): void {
  if (!stored.access_token) return;
  setStoreTokens(toAuthState({ ...stored, access_token: stored.access_token }), false);
  // Restored tokens may be old; let the expiry check decide.
  accessTokenReceivedAt = 0;
}

type LockManagerLike = {
  request: <T>(name: string, callback: () => Promise<T>) => Promise<T>;
};

function getWebLocks(): LockManagerLike | null {
  const locks = (globalThis as { navigator?: { locks?: LockManagerLike } }).navigator?.locks;
  return locks && typeof locks.request === 'function' ? locks : null;
}

async function exchangeRefreshToken(crossTab: boolean): Promise<string> {
  const current = useAuthStore.getState();
  const sentRefreshToken = current.refresh_token;

  if (crossTab) {
    // Another tab may have rotated the pair while we waited for the lock: sending our
    // copy now would be reported as reuse and revoke the session.
    const stored = await getAuthState();
    if (
      stored?.access_token &&
      stored.refresh_token &&
      stored.refresh_token !== sentRefreshToken &&
      stored.session_id === current.session_id
    ) {
      setStoreTokens(toAuthState({ ...stored, access_token: stored.access_token }), true);
      accessTokenReceivedAt = 0;
      return stored.access_token;
    }
  }

  if (!sentRefreshToken || sentRefreshToken === rejectedRefreshToken) {
    throw new RefreshError('No usable refresh token', true);
  }

  const baseUrl = userServiceUrl();
  if (!baseUrl) throw new RefreshError('EXPO_PUBLIC_USER_SERVICE_API_URL is missing', false);

  let data: Partial<SessionTokens> | undefined;
  try {
    const response = await bareClient.post(
      `${baseUrl}/api/v1/auth/refresh`,
      { refresh_token: sentRefreshToken },
      { headers: { 'Content-Type': 'application/json' }, timeout: REFRESH_TIMEOUT_MS }
    );
    data = response.data;
  } catch (error) {
    const status = isAxiosError(error) ? error.response?.status : undefined;
    if (status === 401 || status === 403) {
      rejectedRefreshToken = sentRefreshToken;
      // Sign out only if this is still the session we tried to refresh (not a newer login).
      if (useAuthStore.getState().refresh_token === sentRefreshToken) {
        await handleUnauthorizedResponse();
      }
      throw new RefreshError('Session expired', true);
    }
    // Offline, timeout or a server error: keep the session and let the caller retry later.
    throw new RefreshError('Could not refresh the session', false);
  }

  if (!data?.access_token || !data.refresh_token) {
    throw new RefreshError('Refresh response had no tokens', false);
  }

  // Signed out (or signed in as someone else) while the request was out: drop the result.
  const latest = useAuthStore.getState();
  if (latest.refresh_token !== sentRefreshToken) {
    if (latest.access_token && latest.session_id === current.session_id) return latest.access_token;
    throw new RefreshError('Session changed during refresh', false);
  }

  const next = toAuthState({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    role: data.role ?? latest.role,
    session_id: data.session_id ?? latest.session_id,
  });
  setStoreTokens(next, true);
  await storeAuthState(next);
  return next.access_token as string;
}

/**
 * Exchanges the refresh token for a new pair and resolves with the new access token.
 * Concurrent callers share one request. Rejects with a RefreshError: `definitive` when the
 * server refused the token (the user has already been signed out), otherwise transient.
 */
export function refreshSession(): Promise<string> {
  if (!inFlight) {
    const locks = getWebLocks();
    // Web without Web Locks (an insecure origin, older Safari) still checks the storage the tabs
    // share before sending: that can't close the race between tabs, but it never resends a
    // refresh token another tab has already rotated.
    const run = locks
      ? locks.request(WEB_LOCK_NAME, () => exchangeRefreshToken(true))
      : exchangeRefreshToken(Platform.OS === 'web');
    inFlight = run.finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

/**
 * The access token to send now: refreshed first when it expires within a minute. Never
 * throws; when a refresh fails it returns whatever token the store holds (null once signed
 * out), and the 401 handling takes it from there.
 */
export async function getValidAccessToken(): Promise<string | null> {
  const { access_token, refresh_token } = useAuthStore.getState();
  if (!access_token || !refresh_token || refresh_token === rejectedRefreshToken) {
    return access_token;
  }
  const youngToken =
    accessTokenReceivedAt > 0 && Date.now() - accessTokenReceivedAt < MIN_PROACTIVE_AGE_MS;
  if (youngToken || !isTokenExpiringSoon(access_token)) return access_token;

  try {
    return await refreshSession();
  } catch {
    return useAuthStore.getState().access_token;
  }
}

/**
 * Best-effort server logout (POST /auth/logout deletes the current session). Uses the
 * current access token as is: refreshing here could itself end in a forced sign-out.
 */
export async function revokeCurrentSession(): Promise<void> {
  const token = useAuthStore.getState().access_token;
  const baseUrl = userServiceUrl();
  if (!token || !baseUrl) return;
  try {
    await bareClient.post(`${baseUrl}/api/v1/auth/logout`, null, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: LOGOUT_TIMEOUT_MS,
    });
  } catch {
    // Ignored: the local sign-out goes ahead, and the session expires on its own.
  }
}
