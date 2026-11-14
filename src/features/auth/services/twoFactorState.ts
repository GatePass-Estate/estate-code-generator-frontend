import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Locally cached "is 2FA on?" flag, per user.
 *
 * The API has no 2FA-status endpoint and `/users/profile/me` does not return
 * `totp_enabled`, so the app has to remember what it last observed. This cache
 * is written only from authoritative events:
 *
 *   - the user completed enrolment                        -> true
 *   - the user completed disabling                        -> false
 *   - a login answered with `requires_2fa`                -> true
 *   - the signed-in session carries `is_2fa_verified`     -> true
 *
 * It is keyed by user id so two accounts on one device cannot see each other's
 * state, and persisted so it survives an app reload (the previous in-memory
 * version reported "disabled" after every restart).
 */

const KEY_PREFIX = 'gatepass-2fa-enabled:';

function storageKey(userId?: string | null): string | null {
  if (!userId) return null;
  return `${KEY_PREFIX}${userId}`;
}

export async function readTwoFactorFlag(userId?: string | null): Promise<boolean | null> {
  const key = storageKey(userId);
  if (!key) return null;

  try {
    const value = await AsyncStorage.getItem(key);
    if (value === null) return null;
    return value === 'true';
  } catch {
    return null;
  }
}

export async function writeTwoFactorFlag(
  userId: string | null | undefined,
  enabled: boolean
): Promise<void> {
  const key = storageKey(userId);
  if (!key) return;

  try {
    await AsyncStorage.setItem(key, enabled ? 'true' : 'false');
  } catch {
    // A failed write only costs us the cached value until the next signal.
  }
}

export async function clearTwoFactorFlag(userId?: string | null): Promise<void> {
  const key = storageKey(userId);
  if (!key) return;

  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // Nothing to recover from.
  }
}
