import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ToastType } from '@/src/shared/components/feedback/Toast';
import { useGoBack } from '@/src/shared/hooks/useGoBack';
import { queryKeys } from '@/src/shared/services/api/queryKeys';
import { getUserById } from '@/src/features/users/services/user';
import {
  getPendingDocumentViewUri,
  getUserDocuments,
  getUserDocumentViewUri,
} from '@/src/features/profile/services/userDocuments';
import { useEditRequest, useResolveEditRequest } from '@/src/features/admin/hooks/requests';
import { pickIdCardDocuments } from '@/src/features/admin/utils/editRequests';

export type IdPreview = { uri: string; contentType: string } | null;

/** View URIs for the resident's current (active) and pending ID card; a failed URI is `null`. */
async function loadIdPreviews(userId: string): Promise<{ current: IdPreview; pending: IdPreview }> {
  const { documents } = await getUserDocuments(userId, 'id_card', ['active', 'pending']);
  const { active, pending } = pickIdCardDocuments(documents);
  const [current, next] = await Promise.all([
    active
      ? getUserDocumentViewUri(userId, 'id_card', active.content_type)
          .then((uri) => ({ uri, contentType: active.content_type }))
          .catch(() => null)
      : Promise.resolve(null),
    pending?.document_id
      ? getPendingDocumentViewUri(pending.document_id, pending.content_type)
          .then((uri) => ({ uri, contentType: pending.content_type }))
          .catch(() => null)
      : Promise.resolve(null),
  ]);
  return { current, pending: next };
}

/**
 * One edit request: the request, the requesting resident, ID previews for ID changes, and
 * approve/decline (which refresh the edit-request lists and go back after a short confirmation).
 */
export function useEditRequestDetail(requestId: string | undefined) {
  const goBack = useGoBack();
  const requestQuery = useEditRequest(requestId);
  const request = requestQuery.data ?? null;
  const residentId = request?.resident_id ?? '';
  const isIdChange = request?.request_type === 'id_change';

  const userQuery = useQuery({
    queryKey: queryKeys.users.byId(residentId),
    queryFn: () => getUserById(residentId),
    enabled: Boolean(residentId),
  });
  const previewsQuery = useQuery({
    queryKey: queryKeys.admin.idPreviews(residentId),
    queryFn: () => loadIdPreviews(residentId),
    enabled: Boolean(residentId) && isIdChange,
    // View URIs are signed and short-lived.
    staleTime: 0,
  });

  // An image that fails to render falls back to the placeholder.
  const [brokenPreviews, setBrokenPreviews] = useState<{ current: boolean; new: boolean }>({
    current: false,
    new: false,
  });
  const currentId = brokenPreviews.current ? null : (previewsQuery.data?.current ?? null);
  const newId = brokenPreviews.new ? null : (previewsQuery.data?.pending ?? null);
  const [previewId, setPreviewId] = useState<'current' | 'new' | null>(null);
  const selectedId = previewId === 'current' ? currentId : previewId === 'new' ? newId : null;

  const loading = requestQuery.isLoading || userQuery.isLoading || previewsQuery.isLoading;
  const error = requestQuery.isError
    ? requestQuery.error instanceof Error
      ? requestQuery.error.message
      : 'Failed to load edit request'
    : requestQuery.isSuccess && !request
      ? 'Edit request not found'
      : null;

  const retry = () => {
    setBrokenPreviews({ current: false, new: false });
    void requestQuery.refetch();
    if (residentId) {
      void userQuery.refetch();
      if (isIdChange) void previewsQuery.refetch();
    }
  };

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');
  const showToast = (message: string, type: ToastType) => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const resolve = useResolveEditRequest();
  const [processingAction, setProcessingAction] = useState<'approve' | 'decline' | null>(null);
  // Set once the request is approved/declined: the buttons stay disabled until we navigate back,
  // and the delayed back is cancelled if the admin leaves first (no double pop).
  const [done, setDone] = useState(false);
  const backTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (backTimerRef.current) clearTimeout(backTimerRef.current);
    },
    []
  );

  const handleResolve = async (action: 'approve' | 'decline') => {
    const verb = action === 'approve' ? 'approve' : 'decline';
    setProcessingAction(action);
    try {
      const response = await resolve.mutateAsync({ id: requestId as string, action });
      if (response && response.id) {
        showToast(`Edit request ${verb}d successfully!`, 'success');
        setDone(true);
        backTimerRef.current = setTimeout(() => {
          goBack();
        }, 1500);
      } else {
        showToast(`Failed to ${verb} request. Please try again.`, 'error');
      }
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : `An error occurred while ${verb === 'approve' ? 'approving' : 'declining'} request`,
        'error'
      );
    } finally {
      setProcessingAction(null);
    }
  };

  const handleApprove = async () => {
    if (!request?.new_value) {
      showToast('Cannot approve request: new value is missing', 'error');
      return;
    }
    await handleResolve('approve');
  };

  const handleDecline = () => handleResolve('decline');

  return {
    loading,
    error,
    retry,
    requestData: request,
    requestingUser: userQuery.data ?? null,
    currentId,
    newId,
    markCurrentIdBroken: () => setBrokenPreviews((s) => ({ ...s, current: true })),
    markNewIdBroken: () => setBrokenPreviews((s) => ({ ...s, new: true })),
    previewId,
    setPreviewId,
    selectedId,
    processing: processingAction !== null,
    processingAction,
    done,
    handleApprove,
    handleDecline,
    toast: { visible: toastVisible, message: toastMessage, type: toastType },
    hideToast: () => setToastVisible(false),
  };
}
