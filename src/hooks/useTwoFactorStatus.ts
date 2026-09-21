import { useCallback, useEffect, useState } from 'react';
import { listSessions } from '@/src/lib/api/auth';
import { useAuthStore } from '@/src/lib/stores/authStore';
import { useUserStore } from '@/src/lib/stores/userStore';

/**
 * Override for changes made on this device after sign-in.
 *
 * The session flag we derive from (below) is stamped when the session is
 * created, so enabling or disabling 2FA mid-session does not move it. This
 * remembers what the user just did. It is intentionally in-memory only: on the
 * next sign-in a fresh session carries the correct flag, so there is nothing
 * worth persisting (and nothing to go stale if 2FA changes on another device).
 */
let localOverride: boolean | null = null;

/** Called on sign-out so the next account does not inherit this state. */
export function clearTwoFactorOverride(): void {
  localOverride = null;
}

/** Records a 2FA change made outside a component using the hook. */
export function setTwoFactorOverride(value: boolean): void {
  localOverride = value;
}

/**
 * Reports whether TOTP is enabled for the signed-in user.
 *
 * The profile endpoint (`/users/profile/me`) does not expose `totp_enabled`,
 * and there is no dedicated 2FA-status endpoint, so this derives it from the
 * session list: the backend stamps `is_2fa_verified` on a session only when the
 * account had TOTP enabled at sign-in time.
 *
 * If the profile ever starts returning `totp_enabled`, that value wins — this
 * hook prefers it so no frontend change is needed when the field lands.
 */
export function useTwoFactorStatus() {
  const currentSessionId = useAuthStore((state) => state.session_id);
  const profileFlag = useUserStore((state) => (state as { totp_enabled?: boolean }).totp_enabled);

  const [enabled, setEnabledState] = useState(localOverride ?? false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (typeof profileFlag === 'boolean') {
      setEnabledState(profileFlag);
      setLoading(false);
      return;
    }

    // A change made on this device outranks the session flag, which cannot
    // move until the next sign-in.
    if (localOverride !== null) {
      setEnabledState(localOverride);
      setLoading(false);
      return;
    }

    try {
      const response = await listSessions();
      const items = response?.items ?? [];
      const current = currentSessionId
        ? items.find((session) => session.id === currentSessionId)
        : undefined;

      // Fall back to "any session was 2FA-verified" when we cannot identify the
      // current one (e.g. an older stored auth state with no session id).
      setEnabledState(
        current ? current.is_2fa_verified : items.some((session) => session.is_2fa_verified)
      );
    } catch {
      // A failed lookup should not flip the toggle on; leave it off and let the
      // user's own action drive it.
      setEnabledState(false);
    } finally {
      setLoading(false);
    }
  }, [currentSessionId, profileFlag]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Records a change made on this device and updates the toggle immediately. */
  const setEnabled = useCallback((value: boolean) => {
    localOverride = value;
    setEnabledState(value);
  }, []);

  return { enabled, loading, setEnabled, refresh };
}
