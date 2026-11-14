import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { InternalAxiosRequestConfig } from 'axios';

/**
 * Trusted-device token issued by the user service on login / 2FA / ToS / biometric.
 *
 * Sent as `X-Device-Token` on password login, ToS acceptance, and biometric login so
 * the backend can recognise this install without relying on IP. Survives logout,
 * session expiry, and app restarts — only a future "forget this device" action
 * should clear it.
 *
 * Mobile: expo-secure-store. Web: AsyncStorage (the token must be readable so we
 * can attach the header; a true httpOnly cookie cannot be read by JS).
 */

const STORAGE_KEY = 'gatepass_device_token';

const API_HOSTS = [
  process.env.EXPO_PUBLIC_USER_SERVICE_API_URL,
  process.env.EXPO_PUBLIC_CODE_SERVICE_API_URL,
].filter((value): value is string => !!value);

let cached: string | null | undefined;
let pendingRead: Promise<string | null> | null = null;

async function readStored(): Promise<string | null> {
  try {
    return Platform.OS === 'web'
      ? await AsyncStorage.getItem(STORAGE_KEY)
      : await SecureStore.getItemAsync(STORAGE_KEY);
  } catch {
    return null;
  }
}

async function writeStored(value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') await AsyncStorage.setItem(STORAGE_KEY, value);
    else await SecureStore.setItemAsync(STORAGE_KEY, value);
  } catch {
    // Next login will look like a new device until storage works again.
  }
}

async function removeStored(): Promise<void> {
  try {
    if (Platform.OS === 'web') await AsyncStorage.removeItem(STORAGE_KEY);
    else await SecureStore.deleteItemAsync(STORAGE_KEY);
  } catch {
    // Leave the in-memory cache cleared even if disk delete fails.
  }
}

/** Returns the stored trust token, or null when this install has never been trusted. */
export function getDeviceTrustToken(): Promise<string | null> {
  if (cached !== undefined) return Promise.resolve(cached);
  if (!pendingRead) {
    pendingRead = readStored()
      .then((value) => {
        cached = value;
        return value;
      })
      .finally(() => {
        pendingRead = null;
      });
  }
  return pendingRead;
}

/** Overwrites the stored trust token. Call only when the API returns a non-empty `device_token`. */
export async function setDeviceTrustToken(token: string): Promise<void> {
  cached = token;
  await writeStored(token);
}

/**
 * Clears device trust on this install. Do not call on logout — only when the user
 * explicitly forgets this device.
 */
export async function clearDeviceTrustToken(): Promise<void> {
  cached = null;
  await removeStored();
}

/**
 * When a login / 2FA / ToS / biometric / enable-2FA response includes `device_token`,
 * persist it. Absent or null leaves the existing token alone.
 */
export async function persistDeviceTrustTokenFromResponse(
  data: { device_token?: string | null } | null | undefined
): Promise<void> {
  const token = data?.device_token;
  if (typeof token === 'string' && token.length > 0) {
    await setDeviceTrustToken(token);
  }
}

function isOwnApi(config: InternalAxiosRequestConfig): boolean {
  const target = `${config.baseURL ?? ''}${config.url ?? ''}`;
  return API_HOSTS.some((host) => target.startsWith(host));
}

/**
 * Only these endpoints accept an existing trust token. `/auth/2fa/verify` and
 * `/auth/2fa/recover` always issue a fresh one in the body — do not send the header.
 */
function shouldSendDeviceTrustToken(config: InternalAxiosRequestConfig): boolean {
  if ((config.method ?? 'get').toLowerCase() !== 'post') return false;
  const path = `${config.baseURL ?? ''}${config.url ?? ''}`;
  return (
    /\/auth\/login\/?$/.test(path) ||
    /\/auth\/accept-tos\/?$/.test(path) ||
    /\/auth\/biometric\/login\/?$/.test(path)
  );
}

/**
 * Axios request interceptor: attaches `X-Device-Token` on login, accept-tos, and
 * biometric login when a stored token exists. Never logs the value.
 */
export async function attachDeviceTrustToken(
  config: InternalAxiosRequestConfig
): Promise<InternalAxiosRequestConfig> {
  if (!isOwnApi(config) || !shouldSendDeviceTrustToken(config)) return config;
  try {
    const token = await getDeviceTrustToken();
    if (token) config.headers.set('X-Device-Token', token);
  } catch {
    // Never block a request over the trust token.
  }
  return config;
}
