import { useCallback, useEffect, useState } from 'react';
import { listSessions } from '@/src/lib/api/auth';
import { useAuthStore } from '@/src/lib/stores/authStore';
import { useUserStore } from '@/src/lib/stores/userStore';
import { readTwoFactorFlag, writeTwoFactorFlag } from '@/src/lib/twoFactorState';

/**
 * Reports whether TOTP is enabled for the signed-in user.
 *
 * There is no 2FA-status endpoint and `/users/profile/me` omits `totp_enabled`,
 * so this resolves in priority order:
 *
 *   1. `totp_enabled` from the profile, if the backend ever starts sending it
 *   2. the session list — `is_2fa_verified` is stamped on a session only when
 *      the account had TOTP enabled at sign-in
 *   3. the persisted local flag, which survives reloads and covers the case
 *      where 2FA was switched on *during* the current session (the session's
 *      own flag cannot change until the next sign-in)
 *
 * Anything it learns from (2) is written back to (3).
 */
export function useTwoFactorStatus() {
  const currentSessionId = useAuthStore((state) => state.session_id);
  const userId = useUserStore((state) => state.user_id);
  const profileFlag = useUserStore((state) => (state as { totp_enabled?: boolean }).totp_enabled);

  const [enabled, setEnabledState] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (typeof profileFlag === 'boolean') {
      setEnabledState(profileFlag);
      void writeTwoFactorFlag(userId, profileFlag);
      setLoading(false);
      return;
    }

    // Read the cache first so the toggle is correct immediately on mount
    // instead of flashing "off" while the session list loads.
    const cached = await readTwoFactorFlag(userId);
    if (cached !== null) setEnabledState(cached);

    try {
      const response = await listSessions();
      const items = response?.items ?? [];
      const current = currentSessionId
        ? items.find((session) => session.id === currentSessionId)
        : undefined;

      const verifiedSomewhere = items.some((session) => session.is_2fa_verified);
      const fromSessions = current ? current.is_2fa_verified : verifiedSomewhere;

      // A verified session proves 2FA is on. The converse is not true — a
      // session created before enrolment stays false — so only trust a `false`
      // when the cache has nothing to say.
      if (fromSessions || verifiedSomewhere) {
        setEnabledState(true);
        void writeTwoFactorFlag(userId, true);
      } else if (cached === null) {
        setEnabledState(false);
      }
    } catch {
      // Leave whatever the cache gave us rather than guessing.
    } finally {
      setLoading(false);
    }
  }, [currentSessionId, profileFlag, userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Records a change made on this device and persists it. */
  const setEnabled = useCallback(
    (value: boolean) => {
      setEnabledState(value);
      void writeTwoFactorFlag(userId, value);
    },
    [userId]
  );

  return { enabled, loading, setEnabled, refresh };
}
