import { useCallback, useEffect, useState } from 'react';
import { getTwoFactorStatus } from '@/src/lib/api/auth';
import { useUserStore } from '@/src/lib/stores/userStore';
import { readTwoFactorFlag, writeTwoFactorFlag } from '@/src/lib/twoFactorState';

/**
 * Reports whether TOTP is enabled for the signed-in user.
 *
 * The server is the only authority (see `getTwoFactorStatus`). The locally
 * cached flag is shown first so the toggle does not flicker while the request
 * is in flight, then overwritten with whatever the server says.
 *
 * The cache is only trusted on its own when the server cannot be reached —
 * previously it was trusted over session metadata, which let the toggle show
 * "on" after 2FA had been switched off server-side.
 */
export function useTwoFactorStatus() {
  const userId = useUserStore((state) => state.user_id);

  const [enabled, setEnabledState] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const cached = await readTwoFactorFlag(userId);
    if (cached !== null) setEnabledState(cached);

    const fromServer = await getTwoFactorStatus();
    if (fromServer !== null) {
      setEnabledState(fromServer);
      void writeTwoFactorFlag(userId, fromServer);
    }

    setLoading(false);
  }, [userId]);

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
