import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getTwoFactorStatus } from '@/src/features/auth/services/auth';
import { useUserStore } from '@/src/store/userStore';
import { readTwoFactorFlag, writeTwoFactorFlag } from '@/src/features/auth/services/twoFactorState';
import { queryKeys } from '@/src/shared/services/api/queryKeys';

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
  const queryClient = useQueryClient();

  // The device's last known value, shown until the server answers.
  const [cachedFlag, setCachedFlag] = useState<boolean | null>(null);
  useEffect(() => {
    let mounted = true;
    void readTwoFactorFlag(userId).then((value) => {
      if (mounted && value !== null) setCachedFlag(value);
    });
    return () => {
      mounted = false;
    };
  }, [userId]);

  const { data, isPending, refetch } = useQuery({
    queryKey: queryKeys.auth.twoFactorStatus(userId ?? ''),
    queryFn: async (): Promise<boolean | null> => {
      const fromServer = await getTwoFactorStatus();
      if (fromServer !== null) {
        void writeTwoFactorFlag(userId, fromServer);
        return fromServer;
      }
      // null = the server could not tell; keep showing what this device last knew.
      return (
        (await readTwoFactorFlag(userId)) ??
        queryClient.getQueryData<boolean | null>(queryKeys.auth.twoFactorStatus(userId ?? '')) ??
        null
      );
    },
  });

  const enabled = data ?? cachedFlag ?? false;

  const refresh = useCallback(async () => {
    // Show the device's flag straight away (e.g. just written by the setup screen), then let the
    // server overwrite it.
    const cached = await readTwoFactorFlag(userId);
    if (cached !== null) {
      setCachedFlag(cached);
      queryClient.setQueryData(queryKeys.auth.twoFactorStatus(userId ?? ''), cached);
    }
    // Joins a request already in flight (mount + focus) instead of cancelling it.
    await refetch({ cancelRefetch: false });
  }, [userId, refetch, queryClient]);

  /** Records a change made on this device and persists it. */
  const setEnabled = useCallback(
    (value: boolean) => {
      setCachedFlag(value);
      queryClient.setQueryData(queryKeys.auth.twoFactorStatus(userId ?? ''), value);
      void writeTwoFactorFlag(userId, value);
    },
    [userId, queryClient]
  );

  return { enabled, loading: isPending, setEnabled, refresh };
}
