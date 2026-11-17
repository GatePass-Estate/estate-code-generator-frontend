/**
 * Holds one-time activation tokens so they are not kept in route params
 * (which leak into history, screenshots of URLs, and analytics). Deep-link query strings
 * still arrive with `?token=`; we move them here before navigating to the form screen.
 *
 * On web we also mirror into sessionStorage so React Strict Mode remounts (and soft
 * reloads of /auth/set-password) do not lose the token after the first take().
 */
import { Platform } from 'react-native';

const WEB_STORAGE_KEY = 'gp_pending_auth_token';

let pendingToken: string | null = null;
let pendingEmail: string | null = null;

function readWebStorage(): { token: string | null; email: string | null } {
  if (Platform.OS !== 'web' || typeof sessionStorage === 'undefined') {
    return { token: null, email: null };
  }
  try {
    const raw = sessionStorage.getItem(WEB_STORAGE_KEY);
    if (!raw) return { token: null, email: null };
    const parsed = JSON.parse(raw) as { token?: string; email?: string | null };
    return { token: parsed.token ?? null, email: parsed.email ?? null };
  } catch {
    return { token: null, email: null };
  }
}

function writeWebStorage(token: string | null, email: string | null): void {
  if (Platform.OS !== 'web' || typeof sessionStorage === 'undefined') return;
  try {
    if (!token) {
      sessionStorage.removeItem(WEB_STORAGE_KEY);
      return;
    }
    sessionStorage.setItem(WEB_STORAGE_KEY, JSON.stringify({ token, email }));
  } catch {
    // Private mode / quota — memory stash still works for the same JS context.
  }
}

export function stashPendingAuthToken(token: string, email?: string | null): void {
  pendingToken = token;
  pendingEmail = email ?? null;
  writeWebStorage(token, email ?? null);
}

/** Read without clearing — safe across Strict Mode remounts. */
export function peekPendingAuthToken(): { token: string | null; email: string | null } {
  if (pendingToken) return { token: pendingToken, email: pendingEmail };
  const stored = readWebStorage();
  if (stored.token) {
    pendingToken = stored.token;
    pendingEmail = stored.email;
  }
  return stored;
}

/** Read and clear (use after a successful activate, or when abandoning the flow). */
export function takePendingAuthToken(): { token: string | null; email: string | null } {
  const current = peekPendingAuthToken();
  pendingToken = null;
  pendingEmail = null;
  writeWebStorage(null, null);
  return current;
}

export function clearPendingAuthToken(): void {
  pendingToken = null;
  pendingEmail = null;
  writeWebStorage(null, null);
}
