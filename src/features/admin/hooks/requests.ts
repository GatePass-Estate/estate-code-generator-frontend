import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient } from '@/src/shared/services/api/queryClient';
import { queryKeys } from '@/src/shared/services/api/queryKeys';
import {
  approveRequests,
  declineRequests,
  getRequestById,
  getRequests,
} from '@/src/features/admin/services/requests';
import { SearchRequestPayload } from '@/src/features/admin/types/requests';

export function useEditRequests(params: SearchRequestPayload, enabled = true) {
  return useQuery({
    queryKey: queryKeys.requests.list(params),
    queryFn: () => getRequests(params),
    enabled,
  });
}

export function useEditRequest(id?: string | null) {
  return useQuery({
    queryKey: queryKeys.requests.detail(id ?? ''),
    queryFn: () => getRequestById(id as string),
    enabled: Boolean(id),
  });
}

export function useResolveEditRequest() {
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'decline' }) =>
      action === 'approve' ? approveRequests(id) : declineRequests(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.requests.all });
    },
  });
}
