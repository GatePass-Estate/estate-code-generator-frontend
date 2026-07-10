import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIOMETRIC_TOKEN_KEY = 'gatepass-biometric-auth-token';
const BIOMETRIC_USER_KEY = 'gatepass-biometric-auth-user';
const BIOMETRIC_ESTATE_KEY = `${BIOMETRIC_USER_KEY}-estate`;
const BIOMETRIC_PREFERENCE_KEY = 'gatepass-biometric-auth-preferences';

type BiometricPreferenceMap = Record<string, boolean>;

function biometricPromptDismissedKey(userId: string) {
  return `biometric-prompt-dismissed-${userId}`;
}

/**
 * Returns `true` if the user has previously dismissed the one-time biometric
 * enable prompt on this device.
 */
export async function hasBiometricPromptBeenDismissed(userId: string): Promise<boolean> {
  const value = await AsyncStorage.getItem(biometricPromptDismissedKey(userId));
  return value === 'true';
}

/**
 * Records that the user dismissed the one-time biometric enable prompt so it
 * is not shown again for this user on this device.
 */
export async function dismissBiometricPrompt(userId: string): Promise<void> {
  await AsyncStorage.setItem(biometricPromptDismissedKey(userId), 'true');
}

export type BiometricCredentials = {
  token: string;
  userId: string;
};

/**
 * Checks whether the device supports biometric authentication and the user
 * has enrolled biometrics (e.g. Face ID, fingerprint).
 */
export async function isBiometricAvailable(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync().catch(() => false);
  if (!hasHardware) return false;

  const isEnrolled = await LocalAuthentication.isEnrolledAsync().catch(() => false);
  return isEnrolled;
}

/**
 * Prompts the user for biometric authentication.
 * Returns `true` if the user authenticated successfully.
 *
 * Note: `disableDeviceFallback` is Android-only; iOS will still allow the
 * system passcode fallback when biometrics fail, which we accept as the
 * closest the public API allows.
 */
export async function promptBiometrics(reason?: string): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: reason ?? 'Authenticate',
    cancelLabel: 'Cancel',
    disableDeviceFallback: true,
  }).catch(() => ({ success: false }));

  return result.success;
}

/**
 * Reads the stored biometric access token, if any.
 */
export async function getBiometricToken(): Promise<string | null> {
  return SecureStore.getItemAsync(BIOMETRIC_TOKEN_KEY);
}

/**
 * Reads the stored biometric user id, if any.
 */
export async function getBiometricUserId(): Promise<string | null> {
  return SecureStore.getItemAsync(BIOMETRIC_USER_KEY);
}

/**
 * Removes the stored biometric access token.
 */
export async function deleteBiometricToken(): Promise<void> {
  await SecureStore.deleteItemAsync(BIOMETRIC_TOKEN_KEY);
  await SecureStore.deleteItemAsync(BIOMETRIC_USER_KEY);
  await SecureStore.deleteItemAsync(BIOMETRIC_ESTATE_KEY);
}

function biometricPreferenceKey(identity?: string | null, estateId?: string | null): string {
  if (!identity) {
    return `estate:${estateId ?? ''}`;
  }
  return `${identity}:${estateId ?? ''}`;
}

async function getBiometricPreferenceMap(): Promise<BiometricPreferenceMap> {
  const rawValue = await AsyncStorage.getItem(BIOMETRIC_PREFERENCE_KEY);
  if (!rawValue) return {};

  try {
    const parsedValue = JSON.parse(rawValue) as BiometricPreferenceMap;
    return parsedValue && typeof parsedValue === 'object' ? parsedValue : {};
  } catch {
    return {};
  }
}

export async function isBiometricPreferenceEnabled(
  identity?: string | null,
  estateId?: string | null
): Promise<boolean> {
  const map = await getBiometricPreferenceMap();
  const directKey = biometricPreferenceKey(identity, estateId);
  if (map[directKey]) return true;

  if (identity) {
    return Boolean(map[biometricPreferenceKey(undefined, estateId)]);
  }

  return false;
}

export async function setBiometricPreference(
  identity: string,
  estateId?: string | null,
  enabled = true
): Promise<void> {
  const map = await getBiometricPreferenceMap();
  const nextValue = { ...map };

  if (enabled) {
    nextValue[biometricPreferenceKey(identity, estateId)] = true;
    nextValue[biometricPreferenceKey(undefined, estateId)] = true;
  } else {
    delete nextValue[biometricPreferenceKey(identity, estateId)];
    delete nextValue[biometricPreferenceKey(undefined, estateId)];
  }

  await AsyncStorage.setItem(BIOMETRIC_PREFERENCE_KEY, JSON.stringify(nextValue));
}

export async function clearBiometricPreference(
  identity?: string | null,
  estateId?: string | null
): Promise<void> {
  if (!identity) return;

  const map = await getBiometricPreferenceMap();
  const nextValue = { ...map };
  delete nextValue[biometricPreferenceKey(identity, estateId)];
  delete nextValue[biometricPreferenceKey(undefined, estateId)];
  await AsyncStorage.setItem(BIOMETRIC_PREFERENCE_KEY, JSON.stringify(nextValue));
}

/**
 * Returns `true` only when biometrics are available, a token has been saved,
 * and the biometric preference is enabled for the provided identity/estate.
 */
export async function canUseBiometricLogin(
  identity?: string | null,
  estateId?: string | null
): Promise<boolean> {
  const [available, token, storedEstateId, enabled] = await Promise.all([
    isBiometricAvailable(),
    getBiometricToken(),
    SecureStore.getItemAsync(BIOMETRIC_ESTATE_KEY),
    isBiometricPreferenceEnabled(identity, estateId),
  ]);

  if (!available || token == null || !enabled) return false;

  if (estateId != null && storedEstateId != null && storedEstateId !== estateId) {
    return false;
  }

  return true;
}

/**
 * Returns the stored biometric credentials only if they belong to the given user.
 */
export async function getBiometricCredentialsForUser(
  userId: string
): Promise<BiometricCredentials | null> {
  const [token, storedUserId] = await Promise.all([getBiometricToken(), getBiometricUserId()]);

  if (token == null || storedUserId !== userId) return null;

  return { token, userId: storedUserId };
}

/**
 * Compares the user+estate identity of the freshly signed-in user with the
 * biometric credentials stored on this device. Returns `true` when the stored
 * token belongs to the same user at the same estate.
 */
export async function biometricTokenMatchesUser(
  userId: string,
  estateId?: string | null
): Promise<boolean> {
  const [token, storedUserId, storedEstateId] = await Promise.all([
    getBiometricToken(),
    getBiometricUserId(),
    SecureStore.getItemAsync(BIOMETRIC_ESTATE_KEY),
  ]);

  if (token == null || storedUserId !== userId) return false;
  if (estateId != null && storedEstateId != null && storedEstateId !== estateId) return false;

  return true;
}

/**
 * Stores the access token and user identity that will be used for biometric login.
 * We intentionally do NOT store the user's password.
 */
export async function saveBiometricCredentials(
  token: string,
  userId: string,
  estateId?: string | null
): Promise<void> {
  await SecureStore.setItemAsync(BIOMETRIC_TOKEN_KEY, token);
  await SecureStore.setItemAsync(BIOMETRIC_USER_KEY, userId);
  if (estateId != null) {
    await SecureStore.setItemAsync(BIOMETRIC_ESTATE_KEY, estateId);
  }
  await setBiometricPreference(userId, estateId, true);
}

/**
 * Reads the stored biometric credentials if they match the given user and estate.
 */
export async function getMatchingBiometricCredentials(
  userId: string,
  estateId?: string | null
): Promise<BiometricCredentials | null> {
  const matches = await biometricTokenMatchesUser(userId, estateId);
  if (!matches) return null;

  const token = await getBiometricToken();
  if (!token) return null;

  return { token, userId };
}
