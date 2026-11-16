import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { errorMessage as thrownMessage } from '@/src/shared/services/api/errors';
import { queryKeys } from '@/src/shared/services/api/queryKeys';
import { listSessions, revokeSession } from '@/src/features/auth/services/auth';
import { useAuthStore } from '@/src/features/auth/store/authStore';
import { useAuth } from '@/src/features/auth/hooks/useAuthContext';
import type { SessionListResponse, SessionResponse } from '@/src/features/auth/types/auth';
import { isCurrentSession, removeSession } from '@/src/features/auth/utils/accountSecurity';

/**
 * Linked Devices, shared by web and native: the signed-in sessions (a cached query) and
 * logging one out (a command). Logging out this device signs out locally.
 */
export function useLinkedDevices() {
  const { signOut } = useAuth();
  const queryClient = useQueryClient();
  const currentSessionId = useAuthStore((state) => state.session_id);

  const sessionsQuery = useQuery({
    queryKey: queryKeys.auth.sessions(),
    queryFn: listSessions,
  });
  const { refetch } = sessionsQuery;

  // "Try again" shows the loader again until the list answers, as before.
  const [retrying, setRetrying] = useState(false);
  const retry = useCallback(async () => {
    setRetrying(true);
    try {
      await refetch();
    } finally {
      setRetrying(false);
    }
  }, [refetch]);

  const revokeMutation = useMutation({
    mutationFn: async (session: SessionResponse) => {
      const isCurrent = isCurrentSession(session.id, currentSessionId);
      await revokeSession(session.id);
      // Revoking our own session invalidates this token, so sign out locally
      // instead of re-fetching with a dead credential.
      if (isCurrent) await signOut();
      return isCurrent;
    },
    onSuccess: (signedOut, session) => {
      if (signedOut) return;
      queryClient.setQueryData<SessionListResponse>(queryKeys.auth.sessions(), (current) =>
        current ? removeSession(current, session.id) : current
      );
    },
  });
  const { mutateAsync } = revokeMutation;

  /** Resolves true when this device was the one logged out (already signed out). Throws on failure. */
  const revokeDevice = useCallback(
    (session: SessionResponse) => mutateAsync(session),
    [mutateAsync]
  );

  const isCurrent = useCallback(
    (session: SessionResponse) => isCurrentSession(session.id, currentSessionId),
    [currentSessionId]
  );

  const loadError =
    sessionsQuery.isError && !sessionsQuery.isFetching
      ? thrownMessage(sessionsQuery.error) || 'Could not load your devices.'
      : '';

  return {
    sessions: sessionsQuery.data?.items ?? [],
    loading: sessionsQuery.isPending || retrying,
    loadError,
    retry,
    currentSessionId,
    isCurrent,
    revokeDevice,
    revoking: revokeMutation.isPending,
    revokingId: revokeMutation.isPending ? (revokeMutation.variables?.id ?? null) : null,
  };
}
