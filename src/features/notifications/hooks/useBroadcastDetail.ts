import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getBroadcast, markBroadcastRead } from '@/src/features/notifications/services/broadcast';
import { useNotificationStore } from '@/src/features/notifications/store/notificationStore';
import {
  addLocallyReadBroadcasts,
  markBroadcastOpened,
} from '@/src/features/notifications/utils/readBroadcasts';
import type { BroadcastItem } from '@/src/features/notifications/types/broadcast';
import { errorMessage as thrownMessage } from '@/src/shared/services/api/errors';
import { queryKeys } from '@/src/shared/services/api/queryKeys';
import { useUserStore } from '@/src/store/userStore';

/**
 * One Info Board message (shared by the web and native detail screens).
 *
 * Opening the message counts as reading it: the list may have navigated here
 * without marking it (e.g. a deep link), so an unread message is marked read
 * once per id, best-effort — a failure never blocks showing the message.
 */
export function useBroadcastDetail(broadcastId: string | undefined) {
  const queryClient = useQueryClient();
  const refreshCounts = useNotificationStore((state) => state.refreshCounts);
  const userId = useUserStore((state) => state.user_id);

  // Before the fetch, so the popup never shows this message over its own page.
  useEffect(() => {
    if (broadcastId) markBroadcastOpened(broadcastId);
  }, [broadcastId]);

  const query = useQuery({
    queryKey: queryKeys.broadcasts.detail(broadcastId ?? ''),
    queryFn: () => getBroadcast(broadcastId as string),
    enabled: !!broadcastId,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => markBroadcastRead(id),
    onSuccess: (_result, id) => {
      queryClient.setQueryData<BroadcastItem>(queryKeys.broadcasts.detail(id), (current) =>
        current ? { ...current, is_read: true } : current
      );
      void queryClient.invalidateQueries({
        queryKey: queryKeys.broadcasts.all,
        predicate: (cached) => cached.queryKey[1] === 'list',
      });
      void refreshCounts();
    },
    // Reading is best-effort — never block showing the message.
  });
  const { mutate: markReadMutate } = markRead;

  const markedIds = useRef(new Set<string>());
  const item = query.data;
  useEffect(() => {
    if (!item || item.is_read || markedIds.current.has(item.id)) return;
    markedIds.current.add(item.id);
    // Recorded locally too: the list endpoint under-reports is_read.
    void addLocallyReadBroadcasts(userId, item.id);
    markReadMutate(item.id);
  }, [item, userId, markReadMutate]);

  const { refetch } = query;
  const errorMessage = query.isError
    ? thrownMessage(query.error) || 'Could not load this message.'
    : '';

  return {
    broadcast: item ?? null,
    // A retry after an error shows the loader again, as before.
    loading: query.isPending || (query.isError && query.isFetching),
    errorMessage: query.isFetching ? '' : errorMessage,
    reload: () => void refetch(),
  };
}
