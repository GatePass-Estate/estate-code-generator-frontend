import { useCallback, useMemo } from 'react';
import { useFocusEffect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getRequests } from '@/src/features/admin/services/requests';
import type {
  GetRequestsResponse,
  SearchRequestPayload,
} from '@/src/features/admin/types/requests';
import { queryKeys } from '@/src/shared/services/api/queryKeys';
import {
  EMPTY_PENDING_FIELD_DETAILS,
  mapPendingRequestsToFields,
  toPendingFieldFlags,
} from '@/src/features/profile/utils/profilePendingFields';

/** The request list the pending-field lookup reads (same params as `fetchProfilePendingFields`). */
export function pendingFieldsParams(userId: string): SearchRequestPayload {
  return { page: 1, limit: 20, status: 'pending', resident_id: userId };
}

// Module-level so TanStack Query memoises the mapped result between renders.
const selectPendingFields = (data: GetRequestsResponse) => mapPendingRequestsToFields(data.items);

/**
 * Pending admin edit requests for this user, mapped per profile field. Shares the
 * `requests.list` cache entry with the admin requests hooks (same params, same raw response).
 */
export function useProfilePendingFieldsQuery(
  userId?: string | null,
  options: { refetchOnMount?: boolean | 'always' } = {}
) {
  const params = pendingFieldsParams(userId ?? '');
  return useQuery({
    queryKey: queryKeys.requests.list(params),
    queryFn: () => getRequests(params),
    enabled: Boolean(userId),
    select: selectPendingFields,
    refetchOnMount: options.refetchOnMount,
  });
}

/** Pending field details and flags, refreshed every time the screen gains focus. */
export function useProfilePendingFields(userId?: string | null) {
  const query = useProfilePendingFieldsQuery(userId);
  const { refetch } = query;
  const pendingDetails = (userId && query.data) || EMPTY_PENDING_FIELD_DETAILS;
  const pendingFields = useMemo(() => toPendingFieldFlags(pendingDetails), [pendingDetails]);

  const refreshPendingFields = useCallback(async () => {
    if (!userId) return;
    // Joins a fetch already in flight (e.g. the mount fetch) instead of restarting it.
    await refetch({ cancelRefetch: false });
  }, [refetch, userId]);

  useFocusEffect(
    useCallback(() => {
      void refreshPendingFields();
    }, [refreshPendingFields])
  );

  return {
    pendingDetails,
    pendingFields,
    loadingPending: Boolean(userId) && query.isFetching,
    refreshPendingFields,
  };
}
