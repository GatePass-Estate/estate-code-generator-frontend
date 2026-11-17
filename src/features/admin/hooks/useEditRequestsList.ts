import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQueries } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import type { ToastType } from '@/src/shared/components/feedback/Toast';
import { queryClient } from '@/src/shared/services/api/queryClient';
import { queryKeys } from '@/src/shared/services/api/queryKeys';
import { getUserByIdAdmin } from '@/src/features/users/services/user';
import { approveRequests, declineRequests } from '@/src/features/admin/services/requests';
import { useEditRequests, useResolveEditRequest } from '@/src/features/admin/hooks/requests';
import type { RequestItem } from '@/src/features/admin/types/requests';
import {
  PENDING_EDIT_REQUESTS,
  requesterSummary,
  summarizeBatchResolution,
  toEditRequestViews,
} from '@/src/features/admin/utils/editRequests';

/** Pending edit requests, shared by the mobile list and the desktop table. */
export function useEditRequestsList() {
  const requestsQuery = useEditRequests(PENDING_EDIT_REQUESTS);
  const items = useMemo(() => requestsQuery.data?.items ?? [], [requestsQuery.data]);
  return { requestsQuery, items };
}

/** Mobile list: sorted rows, pull-to-refresh, refetch on refocus, and an error toast. */
export function useEditRequestsMobile() {
  const { requestsQuery, items } = useEditRequestsList();
  const requests = useMemo(() => toEditRequestViews(items), [items]);
  const [refreshing, setRefreshing] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');

  const showError = (message: string) => {
    setToastMessage(message);
    setToastType('error');
    setToastVisible(true);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    const result = await requestsQuery.refetch();
    if (result.isError) {
      showError(
        result.error instanceof Error ? result.error.message : 'Failed to refresh edit requests'
      );
    }
    setRefreshing(false);
  };

  useEffect(() => {
    if (!requestsQuery.isError) return;
    setToastMessage(
      requestsQuery.error instanceof Error
        ? requestsQuery.error.message
        : 'Failed to load edit requests'
    );
    setToastType('error');
    setToastVisible(true);
  }, [requestsQuery.error, requestsQuery.isError]);

  const { isFetched: requestsFetched, refetch: refetchRequests } = requestsQuery;
  useFocusEffect(
    useCallback(() => {
      if (requestsFetched) void refetchRequests();
    }, [refetchRequests, requestsFetched])
  );

  return {
    requests,
    loading: requestsQuery.isLoading,
    refreshing,
    handleRefresh,
    toast: { visible: toastVisible, message: toastMessage, type: toastType },
    hideToast: () => setToastVisible(false),
  };
}

export interface EditRequestRow extends RequestItem {
  selected: boolean;
  userName: string;
  userEmail: string;
}

type ProcessingAction = 'approve-selected' | 'decline-selected' | 'approve-modal' | 'decline-modal';

/**
 * Desktop table: requests with the requester's name/email, multi-select, and approve/decline
 * (one from the detail modal, or every selected row at once).
 */
export function useEditRequestsReview() {
  const { requestsQuery, items } = useEditRequestsList();
  // Requests settled here leave the table straight away (the list refetch follows).
  const [resolvedIds, setResolvedIds] = useState<ReadonlySet<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());
  const [selectedRequest, setSelectedRequest] = useState<EditRequestRow | null>(null);
  const [error, setError] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('error');
  const [processingAction, setProcessingAction] = useState<ProcessingAction | null>(null);

  const pendingItems = useMemo(
    () => items.filter((item) => !resolvedIds.has(item.id)),
    [items, resolvedIds]
  );

  const residentIds = useMemo(
    () => [...new Set(pendingItems.map((item) => item.resident_id))],
    [pendingItems]
  );
  const userQueries = useQueries({
    queries: residentIds.map((residentId) => ({
      queryKey: queryKeys.users.byIdAdmin(residentId),
      queryFn: () => getUserByIdAdmin(residentId),
    })),
  });
  const usersLoading = userQueries.some((query) => query.isLoading);
  const usersById = new Map(residentIds.map((id, index) => [id, userQueries[index]?.data]));

  const editRequests: EditRequestRow[] = pendingItems.map((item) => ({
    ...item,
    selected: selectedIds.has(item.id),
    ...requesterSummary(usersById.get(item.resident_id) ?? null),
  }));
  const loading = requestsQuery.isLoading || usersLoading;

  useEffect(() => {
    if (!requestsQuery.isError) return;
    const err = requestsQuery.error;
    setMessageType('error');
    setError(err instanceof Error ? err.message : 'Failed to load edit requests');
  }, [requestsQuery.isError, requestsQuery.error]);

  const toggleSelection = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedRequests = editRequests.filter((r) => r.selected);
  const allSelected = editRequests.length > 0 && editRequests.every((r) => r.selected);

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(editRequests.map((r) => r.id)));
  };

  const markResolved = (ids: Iterable<string>) => {
    const done = [...ids];
    setResolvedIds((current) => new Set([...current, ...done]));
    setSelectedIds((current) => new Set([...current].filter((id) => !done.includes(id))));
  };

  const resolveOne = useResolveEditRequest();
  const resolveMany = useMutation({
    mutationFn: ({ ids, action }: { ids: string[]; action: 'approve' | 'decline' }) => {
      const send = action === 'approve' ? approveRequests : declineRequests;
      return Promise.allSettled(ids.map((id) => send(id)));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.requests.all });
    },
  });

  const showSuccess = (message: string) => {
    setMessageType('success');
    setError(message);
    setTimeout(() => {
      setError('');
    }, 2000);
  };

  /**
   * Approve/decline every selected request. Each one is settled on its own: the ones the server
   * accepted leave the list even when others fail, and only the failures stay selected for retry.
   */
  const processSelected = async (action: 'approve' | 'decline') => {
    if (selectedRequests.length === 0) {
      setMessageType('error');
      setError(`Please select at least one request to ${action}`);
      return;
    }

    setProcessingAction(action === 'approve' ? 'approve-selected' : 'decline-selected');
    try {
      const ids = selectedRequests.map((r) => r.id);
      const results = await resolveMany.mutateAsync({ ids, action });
      const outcome = summarizeBatchResolution(ids, results, action);

      markResolved(outcome.succeeded);
      if (outcome.succeeded.size > 0) setSelectedRequest(null);

      if (outcome.isError) {
        setMessageType('error');
        setError(outcome.message);
      } else {
        showSuccess(outcome.message);
      }
    } finally {
      setProcessingAction(null);
    }
  };

  const resolveFromModal = async (action: 'approve' | 'decline') => {
    if (!selectedRequest) return;
    setProcessingAction(action === 'approve' ? 'approve-modal' : 'decline-modal');
    try {
      await resolveOne.mutateAsync({ id: selectedRequest.id, action });
      showSuccess(
        action === 'approve'
          ? 'Edit request approved successfully!'
          : 'Edit request declined successfully!'
      );
      markResolved([selectedRequest.id]);
      setSelectedRequest(null);
    } catch (err) {
      const fallback =
        action === 'approve'
          ? 'An error occurred while approving the request'
          : 'An error occurred while declining the request';
      setMessageType('error');
      setError(err instanceof Error ? err.message : fallback);
    } finally {
      setProcessingAction(null);
    }
  };

  return {
    editRequests,
    loading,
    selectedRequests,
    allSelected,
    toggleSelection,
    toggleSelectAll,
    selectedRequest,
    setSelectedRequest,
    error,
    setError,
    messageType,
    running: processingAction !== null,
    processingAction,
    handleApproveSelected: () => processSelected('approve'),
    handleDeclineSelected: () => processSelected('decline'),
    handleApproveFromModal: () => resolveFromModal('approve'),
    handleDeclineFromModal: () => resolveFromModal('decline'),
  };
}
