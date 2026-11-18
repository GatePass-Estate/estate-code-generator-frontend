import * as LocalAuthentication from 'expo-local-authentication';
import { logger } from '@/src/shared/utils/logger';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const BIOMETRIC_TOKEN_KEY = 'gatepass-biometric-auth-token';
const BIOMETRIC_USER_KEY = 'gatepass-biometric-auth-user';
const BIOMETRIC_ESTATE_KEY = `${BIOMETRIC_USER_KEY}-estate`;
const BIOMETRIC_PREFERENCE_KEY = 'gatepass-biometric-auth-preferences';
const BIOMETRIC_STORAGE_MIGRATION_KEY = 'gatepass-biometric-storage-v2';

type BiometricPreferenceMap = Record<string, boolean>;

/**
 * Device-bound keychain / keystore (SEC-10). The biometric token is stored in encrypted secure
 * storage, readable only while the phone is unlocked and never synced off the device.
 *
 * It deliberately does NOT use `requireAuthentication`. With it, the OS asks for Face ID /
 * fingerprint on every Android write and on every iOS update of an existing value, so re-binding
 * the token after a password login could never be silent. The biometric check is enforced in app
 * code instead: callers must run `promptBiometrics()` successfully before `getBiometricToken()`.
 */
const biometricTokenStoreOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

const biometricMetaStoreOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

/**
 * How older builds stored the token (OS-enforced biometric on read/write). Only used to delete
 * those entries once during migration; never to read or write.
 */
const legacyBiometricTokenStoreOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  requireAuthentication: Platform.OS !== 'web',
  authenticationPrompt: 'Unlock GatePass',
};

async function runBiometricStorageMigration(): Promise<void> {
  if (Platform.OS === 'web') return;
  if ((await AsyncStorage.getItem(BIOMETRIC_STORAGE_MIGRATION_KEY)) === 'true') return;

  // Tokens saved by older builds are protected by `requireAuthentication` and can't be
  // overwritten silently. Drop them (deletes don't prompt) along with the stored user/estate
  // binding. The user's preference is left untouched, so the next password login re-enables
  // biometrics silently with the new storage.
  await SecureStore.deleteItemAsync(BIOMETRIC_TOKEN_KEY, legacyBiometricTokenStoreOptions).catch(
    () => {}
  );
  await SecureStore.deleteItemAsync(BIOMETRIC_TOKEN_KEY, biometricTokenStoreOptions).catch(
    () => {}
  );
  await SecureStore.deleteItemAsync(BIOMETRIC_USER_KEY, biometricMetaStoreOptions).catch(() => {});
  await SecureStore.deleteItemAsync(BIOMETRIC_ESTATE_KEY, biometricMetaStoreOptions).catch(
    () => {}
  );

  await AsyncStorage.setItem(BIOMETRIC_STORAGE_MIGRATION_KEY, 'true');
}

let biometricMigration: Promise<void> | null = null;

/**
 * Runs the one-time storage migration (guarded by an AsyncStorage flag) before any biometric
 * credential is read or written. Safe to call repeatedly; a failed run is retried next time.
 */
export function ensureBiometricStorageMigrated(): Promise<void> {
  if (!biometricMigration) {
    biometricMigration = runBiometricStorageMigration().catch((error) => {
      logger.error('Biometric storage migration failed', error);
      biometricMigration = null;
    });
  }
  return biometricMigration;
}

async function getSecureStoreItem(
  key: string,
  options?: SecureStore.SecureStoreOptions
): Promise<string | null> {
  await ensureBiometricStorageMigrated();
  try {
    return await SecureStore.getItemAsync(key, options);
  } catch (error) {
    logger.error(`Secure storage is unavailable for ${key}`, error);
    return null;
  }
}

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
 * Reads the stored biometric token. The OS does not prompt for this read, so callers MUST
 * confirm the user with `promptBiometrics()` first and stop if it fails.
 */
export async function getBiometricToken(): Promise<string | null> {
  return getSecureStoreItem(BIOMETRIC_TOKEN_KEY, biometricTokenStoreOptions);
}

/**
 * Reads the stored biometric user id, if any (no biometric prompt).
 */
export async function getBiometricUserId(): Promise<string | null> {
  return getSecureStoreItem(BIOMETRIC_USER_KEY, biometricMetaStoreOptions);
}

/**
 * Removes the stored biometric access token.
 */
export async function deleteBiometricToken(): Promise<void> {
  await ensureBiometricStorageMigrated();
  await SecureStore.deleteItemAsync(BIOMETRIC_TOKEN_KEY, biometricTokenStoreOptions).catch(
    () => {}
  );
  await SecureStore.deleteItemAsync(BIOMETRIC_USER_KEY, biometricMetaStoreOptions).catch(() => {});
  await SecureStore.deleteItemAsync(BIOMETRIC_ESTATE_KEY, biometricMetaStoreOptions).catch(
    () => {}
  );
}

/**
 * Clears local biometric credentials after logout / expired session without
 * touching the user's preference. The user/estate binding is removed first so
 * biometric login is unavailable until a password login silently re-binds a
 * fresh token to the new session.
 */
export async function invalidateLocalBiometricSession(): Promise<void> {
  await ensureBiometricStorageMigrated();
  await SecureStore.deleteItemAsync(BIOMETRIC_USER_KEY, biometricMetaStoreOptions).catch(() => {});
  await SecureStore.deleteItemAsync(BIOMETRIC_ESTATE_KEY, biometricMetaStoreOptions).catch(
    () => {}
  );
  await SecureStore.deleteItemAsync(BIOMETRIC_TOKEN_KEY, biometricTokenStoreOptions).catch(
    () => {}
  );
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
  return Boolean(map[directKey]);
}

export async function setBiometricPreference(
  identity: string,
  estateId?: string | null,
  enabled = true
): Promise<void> {
  const map = await getBiometricPreferenceMap();
  const nextValue = { ...map };
  const directKey = biometricPreferenceKey(identity, estateId);
  const legacyEstateKey = biometricPreferenceKey(undefined, estateId);

  if (enabled) {
    nextValue[directKey] = true;
    delete nextValue[legacyEstateKey];
  } else {
    delete nextValue[directKey];
    delete nextValue[legacyEstateKey];
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
  const directKey = biometricPreferenceKey(identity, estateId);
  const legacyEstateKey = biometricPreferenceKey(undefined, estateId);

  delete nextValue[directKey];
  delete nextValue[legacyEstateKey];
  await AsyncStorage.setItem(BIOMETRIC_PREFERENCE_KEY, JSON.stringify(nextValue));
}

/**
 * Returns `true` only when biometrics are available, credentials have been saved,
 * and the biometric preference is enabled for the provided identity/estate.
 * Does not read the token itself.
 */
export async function canUseBiometricLogin(
  identity?: string | null,
  estateId?: string | null
): Promise<boolean> {
  const [available, storedUserId, storedEstateId, enabled] = await Promise.all([
    isBiometricAvailable(),
    getBiometricUserId(),
    getSecureStoreItem(BIOMETRIC_ESTATE_KEY, biometricMetaStoreOptions),
    isBiometricPreferenceEnabled(identity, estateId),
  ]);

  if (!available || storedUserId == null || !enabled) return false;

  if (identity != null && storedUserId !== identity) {
    return false;
  }

  if (estateId != null && storedEstateId != null && storedEstateId !== estateId) {
    return false;
  }

  return true;
}

/**
 * Returns the stored biometric credentials only if they belong to the given user.
 * Confirms the user with Face ID / fingerprint before the token is read.
 */
export async function getBiometricCredentialsForUser(
  userId: string
): Promise<BiometricCredentials | null> {
  const storedUserId = await getBiometricUserId();
  if (storedUserId !== userId) return null;

  if (!(await promptBiometrics('Unlock GatePass'))) return null;
  const token = await getBiometricToken();
  if (token == null) return null;

  return { token, userId: storedUserId };
}

/**
 * Compares the user+estate identity of the freshly signed-in user with the
 * biometric credentials stored on this device. Returns `true` when the stored
 * identity matches (does not unlock the token).
 */
export async function biometricTokenMatchesUser(
  userId: string,
  estateId?: string | null
): Promise<boolean> {
  const [storedUserId, storedEstateId] = await Promise.all([
    getBiometricUserId(),
    getSecureStoreItem(BIOMETRIC_ESTATE_KEY, biometricMetaStoreOptions),
  ]);

  if (storedUserId !== userId) return false;
  if (estateId != null && storedEstateId != null && storedEstateId !== estateId) return false;

  return true;
}

/**
 * Stores the biometric token and user identity that will be used for biometric login.
 * We intentionally do NOT store the user's password. The token is device-bound and
 * is only read after the app has confirmed the user with Face ID / fingerprint.
 * Saving never prompts, so re-binding after a password login is silent.
 */
export async function saveBiometricCredentials(
  token: string,
  userId: string,
  estateId?: string | null
): Promise<void> {
  await ensureBiometricStorageMigrated();
  await SecureStore.setItemAsync(BIOMETRIC_TOKEN_KEY, token, biometricTokenStoreOptions);
  await SecureStore.setItemAsync(BIOMETRIC_USER_KEY, userId, biometricMetaStoreOptions);
  if (estateId != null) {
    await SecureStore.setItemAsync(BIOMETRIC_ESTATE_KEY, estateId, biometricMetaStoreOptions);
  }
  await AsyncStorage.setItem('gatepass-last-user-id', userId);
  await setBiometricPreference(userId, estateId, true);
}

/**
 * Reads the stored biometric credentials if they match the given user and estate.
 * Confirms the user with Face ID / fingerprint before the token is read.
 */
export async function getMatchingBiometricCredentials(
  userId: string,
  estateId?: string | null
): Promise<BiometricCredentials | null> {
  const matches = await biometricTokenMatchesUser(userId, estateId);
  if (!matches) return null;

  if (!(await promptBiometrics('Unlock GatePass'))) return null;
  const token = await getBiometricToken();
  if (!token) return null;

  return { token, userId };
}
