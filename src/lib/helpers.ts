import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { AuthState } from './stores/authStore';
import { isAxiosError } from 'axios';
import { AuthBroadcastMessage, UserRolesType } from '../types/general';
import type { Codes } from '../types/codes';
import icons from '../constants/icons';
import { Platform } from 'react-native';

const authStorageKey = 'auth-key';
// Native keeps the refresh token in the keychain/keystore; web has only localStorage, which
// also lets other tabs pick up a rotated pair (see authRefresh.ts).
const refreshTokenSecureKey = 'gatepass-refresh-token';
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
      } catch (error) {
        // A stale refresh token would be reported as reuse and revoke the session, so drop it.
        console.log('Error saving refresh token', error);
        await SecureStore.deleteItemAsync(refreshTokenSecureKey).catch(() => {});
      }
    }
    const stored: AuthState = keepsRefreshTokenInSecureStore
      ? rest
      : { ...rest, refresh_token: refresh_token ?? null };
    await AsyncStorage.setItem(authStorageKey, JSON.stringify(stored));
    return true;
  } catch (error) {
    console.log('Error saving auth state', error);
    return false;
  }
};

const clearStoredRefreshToken = async (): Promise<void> => {
  if (!keepsRefreshTokenInSecureStore) return;
  await SecureStore.deleteItemAsync(refreshTokenSecureKey).catch((error) => {
    console.log('Error clearing refresh token', error);
  });
};

export const clearAuthState = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(authStorageKey);
  } catch (error) {
    console.log('Error clearing auth state', error);
  }
  await clearStoredRefreshToken();
};

export const clearAccessToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(authStorageKey);
  } catch (error) {
    console.log('Error clearing access token', error);
  }
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
    }
    return { ...state, refresh_token: state.refresh_token ?? null };
  } catch (error) {
    console.log('Error retrieving auth state', error);
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
  } catch (error) {
    console.log('Error saving selected institution', error);
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
  } catch (error) {
    console.log('Error saving last login institution', error);
  }
};

export const getLastLoginInstitution = async (): Promise<SelectedInstitution | null> => {
  try {
    const value = await AsyncStorage.getItem(LAST_LOGIN_INSTITUTION_KEY);
    return value ? (JSON.parse(value) as SelectedInstitution) : null;
  } catch (error) {
    console.log('Error retrieving last login institution', error);
    return null;
  }
};

export const getSelectedInstitution = async (): Promise<SelectedInstitution | null> => {
  try {
    const value = await AsyncStorage.getItem(INSTITUTION_STORAGE_KEY);
    return value ? (JSON.parse(value) as SelectedInstitution) : null;
  } catch (error) {
    console.log('Error retrieving selected institution', error);
    return null;
  }
};

export const clearSelectedInstitution = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(INSTITUTION_STORAGE_KEY);
  } catch (error) {
    console.log('Error clearing selected institution', error);
  }
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
  } catch (error) {
    console.log('Error retrieving forgot-password cooldown', error);
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
  } catch (error) {
    console.log('Error recording forgot-password attempt', error);
  }
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
  } catch (error) {
    console.log('Error clearing forgot-password cooldown', error);
  }
};

export const getErrorMessage = (error: any): string => {
  if (isAxiosError(error) && error.response?.data) {
    const data = error.response.data;

    if (Array.isArray(data.detail)) {
      const messages = data.detail
        .map((item: any) => (typeof item === 'string' ? item : item?.msg))
        .filter((msg: unknown): msg is string => typeof msg === 'string' && msg.trim().length > 0);
      if (messages.length > 0) {
        return messages.join('. ');
      }
    }

    if (typeof data.detail === 'string' && data.detail.trim().length > 0) {
      return data.detail;
    }

    if (data.detail && typeof data.detail === 'object' && typeof data.detail.message === 'string') {
      return data.detail.message;
    }

    if (typeof data.message === 'string' && data.message.trim().length > 0) {
      return data.message;
    }
  }

  if (error.message) {
    if (error.message === 'Network Error')
      return 'Network error - please check your internet connection.';

    if (error.message === 'Request failed with status code 401')
      return 'Unauthorized - please check your credentials.';

    if (error.message === 'Request failed with status code 403')
      return 'Forbidden - you do not have permission to access this resource.';

    if (error.message === 'Request failed with status code 404')
      return 'Not Found - the requested resource could not be found.';

    if (error.message === 'Request failed with status code 409')
      return 'A conflicting request or subscription state already exists. Please refresh and try again.';

    if (error.message === 'Request failed with status code 422')
      return 'Invalid checkout or request details. Please verify your selection and try again.';

    if (error.message === 'Request failed with status code 500')
      return 'Server error - please try again later.';

    if (
      error.message.includes('timeout') ||
      error.message.includes('timed out') ||
      error.message.includes('exceeded')
    )
      return 'Request timed out - please check your network connection and try again.';
  }

  return error.message ?? 'An unknown error occurred';
};

export const ordinalSuffix = (day: number): string => {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
};

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const formatDateWithOrdinal = (date: Date): string => {
  const d = date.getDate();
  const m = monthNames[date.getMonth()];
  const y = date.getFullYear();
  return `${d}${ordinalSuffix(d)} ${m} ${y}`;
};

/** Parse API datetime strings that may use a space separator or offset without a colon. */
export const parseLogDate = (value: string): Date => {
  // ``2026-07-25 14:00:00.000+0000`` → ``2026-07-25T14:00:00.000+00:00``
  const iso = value
    .trim()
    .replace(' ', 'T')
    .replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
  return new Date(iso);
};

export const logDateMs = (value: string): number => {
  const time = parseLogDate(value).getTime();
  return Number.isFinite(time) ? time : 0;
};

/** Newest timestamp first. Equal (or unparseable) times keep their original order. */
export const compareLogDatesDesc = (a: string, b: string): number => logDateMs(b) - logDateMs(a);

/**
 * Past history card — UTC calendar day from ``visit_time`` (date only; time is on details)
 * e.g. ``2026-07-14T23:35:33.854563Z`` → ``14th July 2026``
 */
export const formatPastHistoryVisitDate = (value?: string | null): string => {
  if (!value) return '—';
  const date = parseLogDate(value);
  if (Number.isNaN(date.getTime())) return value;
  const d = date.getUTCDate();
  const m = monthNames[date.getUTCMonth()];
  const y = date.getUTCFullYear();
  return `${d}${ordinalSuffix(d)} ${m} ${y}`;
};

/**
 * Upcoming history card — local time of ``validity_period.start``
 * e.g. ``2026-07-25 13:00:00.000+0000`` → ``25 July 14:00`` in WAT
 */
export const formatUpcomingInviteCardDate = (value?: string | null): string => {
  if (!value) return 'Scheduled';
  const date = parseLogDate(value);
  if (Number.isNaN(date.getTime())) return value;
  const day = date.getDate();
  const month = date.toLocaleString('en-GB', { month: 'long' });
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${hours}:${minutes}`;
};

/** ``HH:MM`` of a local time, as the UTC time of day the server compares validity windows with. */
export const toUtcClock = (date: Date): string =>
  `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`;

/** A server ``HH:MM`` (UTC time of day) shown as the local ``HH:MM``. */
export const utcClockToLocal = (value: string): string => {
  const [h, m] = value.split(':').map(Number);
  const date = new Date();
  date.setUTCHours(h, m, 0, 0);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

/** True when the invite's validity window has not started yet (History → Upcoming). */
export function isUpcomingCode(code: Codes, now = Date.now()): boolean {
  const start = code.validity_period?.start;
  if (!start) return false;
  const startMs = parseLogDate(start).getTime();
  return Number.isFinite(startMs) && startMs > now;
}

/**
 * Upcoming invite detail — local calendar date
 * e.g. ``2026-07-25 13:00:00.000+0000`` → ``Saturday, 25 July 2026``
 */
export const formatInviteScheduleDate = (value?: string | null): string => {
  if (!value) return '—';
  const date = parseLogDate(value);
  if (Number.isNaN(date.getTime())) return value;
  const weekday = date.toLocaleString('en-GB', { weekday: 'long' });
  const day = date.getDate();
  const month = date.toLocaleString('en-GB', { month: 'long' });
  const year = date.getFullYear();
  return `${weekday}, ${day} ${month} ${year}`;
};

/**
 * Upcoming invite clock, in local time. A bare ``HH:MM`` is a validity-window bound (UTC time of
 * day); a datetime is a UTC instant.
 * e.g. ``13:00`` or ``2026-07-25 13:00:00.000+0000`` → ``14:00`` in WAT
 */
export const formatInviteClockTime = (value?: string | null): string => {
  if (!value) return '—';
  const trimmed = value.trim();
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(trimmed)) return utcClockToLocal(trimmed);
  const date = parseLogDate(trimmed);
  if (Number.isNaN(date.getTime())) return trimmed;
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

export type MonthGroup<T> = {
  label: string;
  items: T[];
};

function monthGroupKey(date: Date, utc: boolean): string {
  const year = utc ? date.getUTCFullYear() : date.getFullYear();
  const month = utc ? date.getUTCMonth() : date.getMonth();
  return `${year}-${String(month).padStart(2, '0')}`;
}

function compareMonthKeysDesc(a: string, b: string): number {
  const [aYear, aMonth] = a.split('-').map(Number);
  const [bYear, bMonth] = b.split('-').map(Number);
  return bYear - aYear || bMonth - aMonth;
}

/** Group items by calendar month (newest month first; items newest-first within each month). */
export function groupLogsByMonth<T>(
  logs: T[],
  getDate: (item: T) => string,
  options?: { utc?: boolean }
): MonthGroup<T>[] {
  const useUtc = options?.utc ?? false;
  const groups = new Map<string, T[]>();

  logs.forEach((log) => {
    const key = monthGroupKey(parseLogDate(getDate(log)), useUtc);
    const existing = groups.get(key) ?? [];
    existing.push(log);
    groups.set(key, existing);
  });

  return Array.from(groups.entries())
    .sort(([a], [b]) => compareMonthKeysDesc(a, b))
    .map(([key, items]) => {
      const [year, month] = key.split('-').map(Number);
      const label = useUtc
        ? new Date(Date.UTC(year, month, 1))
            .toLocaleString('en-US', { month: 'long', timeZone: 'UTC' })
            .toUpperCase()
        : new Date(year, month, 1).toLocaleString('en-US', { month: 'long' }).toUpperCase();

      return {
        label,
        items: [...items].sort((a, b) => compareLogDatesDesc(getDate(a), getDate(b))),
      };
    });
}

/** Access log card "Generated:" label — UTC calendar day from API ``created_at``. */
export const formatGeneratedOnDate = (date: Date): string => {
  const d = date.getUTCDate();
  const m = monthNames[date.getUTCMonth()];
  return `${d}${ordinalSuffix(d)} of ${m}`;
};

/** Format access-log timestamps in UTC so they match API `...Z` values. */
export const formatAccessLogTimestamp = (date: Date): string => {
  const d = date.getUTCDate();
  const m = monthNames[date.getUTCMonth()];
  const y = date.getUTCFullYear();
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  return `${d} ${m} ${y}, ${hours}:${minutes}`;
};

export const formatAccessCodeWithSpace = (code: string): string => {
  const cleaned = code.replace(/\s+/g, '').toUpperCase();
  if (cleaned.length <= 3) return cleaned;
  const mid = Math.ceil(cleaned.length / 2);
  return `${cleaned.slice(0, mid)} ${cleaned.slice(mid)}`;
};

export const timeCalc = (
  valid_until: string | Date | undefined
): {
  formattedDate: string;
  timeframe: string;
  timeLeftMinutes: number;
} => {
  const iso = String(valid_until ?? '')
    .replace(' ', 'T')
    .replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
  const parsed = new Date(iso);

  let formattedDate = 'Invalid date';
  let timeframe = 'Unknown';
  let timeLeftMinutes = 0;

  if (!isNaN(parsed.getTime())) {
    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = parsed.getFullYear();
    formattedDate = `${day}/${month}/${year}`;

    const diffMs = parsed.getTime() - Date.now();
    if (diffMs <= 0) {
      timeframe = 'Expired';
    } else {
      const startDate = new Date(parsed.getTime() - 60 * 60 * 1000);
      const formatTime = (d: Date) =>
        d
          .toLocaleTimeString(undefined, {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })
          .replace(/\s+/g, '')
          .toLowerCase();
      timeLeftMinutes = Math.floor((diffMs % 3600000) / 60000);
      timeframe = `${formatTime(startDate)} to ${formatTime(parsed)}`;
    }
  }

  return { formattedDate, timeframe, timeLeftMinutes };
};

/**
 * Invite details from the actual start/end the user selected (local picker values).
 * Prefer this over ``timeCalc(valid_until)``, which invents a 1-hour window from the end only.
 */
export const formatInvitePeriodDisplay = (
  start: Date,
  end: Date
): { formattedDate: string; timeframe: string } => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const formatDate = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  const formatTime = (d: Date) =>
    d
      .toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
      .replace(/\s+/g, '')
      .toLowerCase();

  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  return {
    formattedDate: sameDay ? formatDate(start) : `${formatDate(start)} - ${formatDate(end)}`,
    timeframe: `${formatTime(start)} to ${formatTime(end)}`,
  };
};

export const getRoleIcon = (role: UserRolesType) => {
  switch (role) {
    case 'resident':
      return icons.adminHomeIcon;
    case 'security':
      return icons.securityIcon;
    case 'primary_admin':
    case 'admin':
      return icons.activeAdminIcon;
    default:
      return icons.adminHomeIcon;
  }
};

export const getRoleIconHeight = (role: UserRolesType): number => {
  switch (role) {
    case 'primary_admin':
    case 'admin':
      return 28;
    default:
      return 28;
  }
};

export const getRoleIconWidth = (role: UserRolesType) => {
  switch (role) {
    case 'primary_admin':
    case 'admin':
      return 23;
    default:
      return 28;
  }
};

export const getRoleColor = (role: UserRolesType) => {
  switch (role) {
    case 'resident':
      return '#FF9A56';
    case 'security':
      return '#1B998B';
    case 'primary_admin':
      return '#333333';
    default:
      return '#333333';
  }
};

export const isDataEqual = (obj1: any, obj2: any): boolean => {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
};

export const getWidthBreakpoint = (): number => {
  const breakpoint = process.env.EXPO_PUBLIC_WIDTH_BREAKPOINT;
  return breakpoint ? parseInt(breakpoint, 10) : 768;
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
