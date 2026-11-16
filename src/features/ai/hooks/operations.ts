import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient } from '@/src/shared/services/api/queryClient';
import { incidentManagementApi } from '@/src/features/ai/services/incidentManagement';
import { queryKeys } from '@/src/shared/services/api/queryKeys';

export function useManagedIncidentReports(scope: 'all' | 'mine', enabled = true) {
  return useQuery({
    queryKey: queryKeys.incidents.managed(scope),
    queryFn: () =>
      scope === 'mine' ? incidentManagementApi.listMyAll() : incidentManagementApi.listAll(),
    enabled,
  });
}

export function useManagedIncidentReport(
  id?: string | null,
  scope: 'all' | 'mine' = 'all',
  enabled = true
) {
  return useQuery({
    queryKey: [...queryKeys.incidents.managedDetail(id ?? ''), scope],
    queryFn: () =>
      scope === 'mine'
        ? incidentManagementApi.getMy(id as string)
        : incidentManagementApi.get(id as string),
    enabled: Boolean(id) && enabled,
  });
}

export function useCreateIncidentReport() {
  return useMutation({
    mutationFn: incidentManagementApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.incidents.managed('all') });
      void queryClient.invalidateQueries({ queryKey: queryKeys.incidents.managed('mine') });
    },
  });
}

export function useMarkIncidentReportRead() {
  return useMutation({
    mutationFn: (id: string) => incidentManagementApi.markRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.incidents.managed('all') });
    },
  });
}

export function useClearReadIncidentReports() {
  return useMutation({
    mutationFn: () => incidentManagementApi.clearRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.incidents.managed('all') });
    },
  });
}
