import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { AuthState } from '@/src/features/auth/store/authStore';
import { AuthBroadcastMessage, UserRolesType } from '@/src/shared/types/general';

const authStorageKey = 'auth-key';
// Native keeps the refresh token in the keychain/keystore; web has only localStorage, which
// also lets other tabs pick up a rotated pair (see authRefresh.ts).
const refreshTokenSecureKey = 'gatepass-refresh-token';
// The access token is a bearer credential too, so on native it is kept out of plain AsyncStorage.
const accessTokenSecureKey = 'gatepass-access-token';
const keepsRefreshTokenInSecureStore = Platform.OS !== 'web';

const BROADCAST_CHANNEL_NAME = 'gatepass-auth-sync';

let broadcastChannel: BroadcastChannel | null = null;
let storageEventListener: ((event: StorageEvent) => void) | null = null;

export const initAuthSync = (callbacks: {
  onLogin: (token: string, role: UserRolesType) => void;
  onLogout: () => void;
}): (() => void) => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return () => {};
  }

  if (typeof BroadcastChannel !== 'undefined') {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    broadcastChannel.onmessage = (event: MessageEvent<AuthBroadcastMessage>) => {
      const message = event.data;
      if (message.type === 'LOGIN') {
        callbacks.onLogin(message.payload.token, message.payload.role);
      } else if (message.type === 'LOGOUT') {
        callbacks.onLogout();
      }
    };
  } else {
    // Fallback to storage event for older browsers
    storageEventListener = (event: StorageEvent) => {
      // Only handle events for our auth key and from other tabs (event.newValue !== current value)
      if (event.key === authStorageKey && !event.newValue) {
        // Key was removed (logout in another tab)
        callbacks.onLogout();
      }
      // Note: For login, we can't reliably detect token changes via storage events
      // because AsyncStorage may update before the event fires. We rely on BroadcastChannel
      // for login sync, and storage event as a fallback for logout only.
    };
    window.addEventListener('storage', storageEventListener);
  }

  // Return cleanup function
  return () => {
    if (broadcastChannel) {
      broadcastChannel.close();
      broadcastChannel = null;
    }
    if (storageEventListener) {
      window.removeEventListener('storage', storageEventListener);
      storageEventListener = null;
    }
  };
};

/**
 * Broadcast login event to all other tabs
 */
export const broadcastLogin = (token: string, role: UserRolesType): void => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;

  const message: AuthBroadcastMessage = {
    type: 'LOGIN',
    payload: { token, role, timestamp: Date.now() },
  };

  if (broadcastChannel) {
    broadcastChannel.postMessage(message);
  }
  // Note: storage events are automatically triggered by AsyncStorage on web
};

/**
 * Broadcast logout event to all other tabs
 */
export const broadcastLogout = (): void => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;

  const message: AuthBroadcastMessage = {
    type: 'LOGOUT',
    payload: { timestamp: Date.now() },
  };

  if (broadcastChannel) {
    broadcastChannel.postMessage(message);
  }
  // Note: storage events are automatically triggered by AsyncStorage on web
};

export const storeAuthState = async (userData: AuthState): Promise<boolean> => {
  try {
    const { refresh_token, ...rest } = userData;
    if (keepsRefreshTokenInSecureStore) {
      try {
        if (refresh_token) await SecureStore.setItemAsync(refreshTokenSecureKey, refresh_token);
        else await SecureStore.deleteItemAsync(refreshTokenSecureKey);
      } catch {
        // A stale refresh token would be reported as reuse and revoke the session, so drop it.
        await SecureStore.deleteItemAsync(refreshTokenSecureKey).catch(() => {});
      }
    }
    let stored: AuthState = keepsRefreshTokenInSecureStore
      ? rest
      : { ...rest, refresh_token: refresh_token ?? null };
    if (keepsRefreshTokenInSecureStore) {
      const { access_token, ...withoutAccess } = stored;
      try {
        if (access_token) await SecureStore.setItemAsync(accessTokenSecureKey, access_token);
        else await SecureStore.deleteItemAsync(accessTokenSecureKey);
        stored = { ...withoutAccess, access_token: null };
      } catch {
        // Keychain unavailable: keep the previous behaviour rather than losing the session.
        await SecureStore.deleteItemAsync(accessTokenSecureKey).catch(() => {});
      }
    }
    await AsyncStorage.setItem(authStorageKey, JSON.stringify(stored));
    return true;
  } catch {
    return false;
  }
};

const clearStoredRefreshToken = async (): Promise<void> => {
  if (!keepsRefreshTokenInSecureStore) return;
  await SecureStore.deleteItemAsync(refreshTokenSecureKey).catch(() => {});
  await SecureStore.deleteItemAsync(accessTokenSecureKey).catch(() => {});
};

export const clearAuthState = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(authStorageKey);
  } catch {}
  await clearStoredRefreshToken();
};

export const clearAccessToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(authStorageKey);
  } catch {}
  await clearStoredRefreshToken();
};

/** Stored session, or null. `refresh_token` is null for sessions saved before refresh tokens. */
export const getAuthState = async (): Promise<AuthState | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(authStorageKey);
    if (jsonValue == null) return null;
    const state: AuthState = JSON.parse(jsonValue);
    if (keepsRefreshTokenInSecureStore) {
      state.refresh_token = await SecureStore.getItemAsync(refreshTokenSecureKey).catch(() => null);
      // Sessions saved before the access token moved to SecureStore still carry it in the blob;
      // the next storeAuthState moves it.
      const secureAccess = await SecureStore.getItemAsync(accessTokenSecureKey).catch(() => null);
      if (secureAccess) state.access_token = secureAccess;
    }
    return { ...state, refresh_token: state.refresh_token ?? null };
  } catch {
    return null;
  }
};

const INSTITUTION_STORAGE_KEY = 'selected-institution';
const LAST_LOGIN_INSTITUTION_KEY = 'last-login-institution';

export type SelectedInstitution = {
  estate_id: string;
  estate_name: string;
};

export const setSelectedInstitution = async (
  institution: SelectedInstitution
): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(INSTITUTION_STORAGE_KEY, JSON.stringify(institution));
    return true;
  } catch {
    return false;
  }
};

export const setLastLoginInstitution = async (
  institution: SelectedInstitution | null
): Promise<void> => {
  try {
    if (!institution) {
      await AsyncStorage.removeItem(LAST_LOGIN_INSTITUTION_KEY);
      return;
    }
    await AsyncStorage.setItem(LAST_LOGIN_INSTITUTION_KEY, JSON.stringify(institution));
  } catch {}
};

export const getLastLoginInstitution = async (): Promise<SelectedInstitution | null> => {
  try {
    const value = await AsyncStorage.getItem(LAST_LOGIN_INSTITUTION_KEY);
    return value ? (JSON.parse(value) as SelectedInstitution) : null;
  } catch {
    return null;
  }
};

export const getSelectedInstitution = async (): Promise<SelectedInstitution | null> => {
  try {
    const value = await AsyncStorage.getItem(INSTITUTION_STORAGE_KEY);
    return value ? (JSON.parse(value) as SelectedInstitution) : null;
  } catch {
    return null;
  }
};

export const clearSelectedInstitution = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(INSTITUTION_STORAGE_KEY);
  } catch {}
};

export const getPostAuthRedirectRoute = (
  institution: SelectedInstitution | null
): '/auth/login' | '/auth/institution' => {
  return institution ? '/auth/login' : '/auth/institution';
};

const FORGOT_PASSWORD_COOLDOWN_KEY = 'forgot-password-cooldown';

export type ForgotPasswordCooldown = {
  attempts: number;
  email: string;
  lastAttemptAt: string;
};

const COOLDOWN_SECONDS = [0, 30, 60, 120, 300];
const COOLDOWN_RESET_HOURS = 24;

export const getForgotPasswordCooldown = async (): Promise<ForgotPasswordCooldown | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(FORGOT_PASSWORD_COOLDOWN_KEY);
    if (!jsonValue) return null;
    const parsed = JSON.parse(jsonValue) as ForgotPasswordCooldown;
    const lastAttempt = new Date(parsed.lastAttemptAt).getTime();
    const resetAfterMs = COOLDOWN_RESET_HOURS * 60 * 60 * 1000;
    if (Number.isNaN(lastAttempt) || Date.now() - lastAttempt > resetAfterMs) {
      return { attempts: 0, email: '', lastAttemptAt: new Date(0).toISOString() };
    }
    return parsed;
  } catch {
    return null;
  }
};

export const recordForgotPasswordAttempt = async (email?: string): Promise<void> => {
  try {
    const current = await getForgotPasswordCooldown();
    const attempts = (current?.attempts ?? 0) + 1;
    const payload: ForgotPasswordCooldown = {
      attempts,
      email: email?.trim().toLowerCase() ?? '',
      lastAttemptAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(FORGOT_PASSWORD_COOLDOWN_KEY, JSON.stringify(payload));
  } catch {}
};

export const getForgotPasswordCooldownSeconds = async (email?: string): Promise<number> => {
  const cooldown = await getForgotPasswordCooldown();
  const normalizedEmail = email?.trim().toLowerCase();

  if (!cooldown || !normalizedEmail) return 0;
  if (cooldown.email && cooldown.email !== normalizedEmail) return 0;

  const attempts = cooldown.attempts ?? 0;
  if (attempts === 0) return 0;

  const index = Math.min(attempts, COOLDOWN_SECONDS.length - 1);
  const cooldownSeconds = COOLDOWN_SECONDS[index];
  if (cooldownSeconds === 0) return 0;

  const lastAttempt = new Date(cooldown.lastAttemptAt).getTime();
  if (Number.isNaN(lastAttempt)) return 0;

  const elapsedSeconds = Math.floor((Date.now() - lastAttempt) / 1000);
  const remainingSeconds = cooldownSeconds - elapsedSeconds;

  return remainingSeconds > 0 ? remainingSeconds : 0;
};

export const clearForgotPasswordCooldown = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(FORGOT_PASSWORD_COOLDOWN_KEY);
  } catch {}
};

let canViewActivationStatus = false;

const ACTIVATION_STATUS_STORAGE_KEY = 'activation-status-access';

export function grantActivationStatusAccess() {
  canViewActivationStatus = true;
  if (Platform.OS === 'web' && typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(ACTIVATION_STATUS_STORAGE_KEY, '1');
  }
}

export function consumeActivationStatusAccess(): boolean {
  if (Platform.OS === 'web' && typeof sessionStorage !== 'undefined') {
    const allowed = sessionStorage.getItem(ACTIVATION_STATUS_STORAGE_KEY) === '1';
    sessionStorage.removeItem(ACTIVATION_STATUS_STORAGE_KEY);
    if (allowed) return true;
  }

  if (canViewActivationStatus) {
    canViewActivationStatus = false;
    return true;
  }

  return false;
}
