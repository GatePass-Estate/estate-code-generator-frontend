import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { InternalAxiosRequestConfig } from 'axios';

/**
 * Stable per-install identifier, sent to the API as `X-Device-Id`.
 *
 * The backend currently decides "new device" from the client IP alone, and
 * mobile networks rotate IPs, so the same phone is reported as a new device on
 * most logins. Recognising the install needs an identifier that survives IP
 * changes — this is the app's half of that fix. Until the backend reads the
 * header it is simply ignored.
 *
 * Generated once and kept in SecureStore (AsyncStorage on web). It identifies
 * an install, not a person, and is only ever sent to GatePass's own API.
 */

const STORAGE_KEY = 'gatepass-device-id';

let cached: string | null = null;
let pending: Promise<string> | null = null;

function generateId(): string {
  const bytes = new Uint8Array(16);
  const cryptoApi = (globalThis as { crypto?: { getRandomValues?: (a: Uint8Array) => void } })
    .crypto;
  if (cryptoApi?.getRandomValues) {
    cryptoApi.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  // RFC 4122 version 4 layout.
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

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
    // Worst case a new id is generated next launch: one extra "new device" alert.
  }
}

/** Returns this install's id, creating and persisting it on first use. */
export function getDeviceId(): Promise<string> {
  if (cached) return Promise.resolve(cached);
  if (!pending) {
    pending = (async () => {
      const stored = await readStored();
      const id = stored || generateId();
      if (!stored) await writeStored(id);
      cached = id;
      return id;
    })().finally(() => {
      pending = null;
    });
  }
  return pending;
}

const API_HOSTS = [
  process.env.EXPO_PUBLIC_USER_SERVICE_API_URL,
  process.env.EXPO_PUBLIC_CODE_SERVICE_API_URL,
].filter((value): value is string => !!value);

function isOwnApi(config: InternalAxiosRequestConfig): boolean {
  const target = `${config.baseURL ?? ''}${config.url ?? ''}`;
  return API_HOSTS.some((host) => target.startsWith(host));
}

/** Axios request interceptor: tags requests to our own API with the device id. */
export async function attachDeviceId(
  config: InternalAxiosRequestConfig
): Promise<InternalAxiosRequestConfig> {
  if (!isOwnApi(config)) return config;
  try {
    config.headers.set('X-Device-Id', await getDeviceId());
  } catch {
    // Never block a request over the device id.
  }
  return config;
}
