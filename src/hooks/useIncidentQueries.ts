import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { incidentReportsApi, type IncidentReportsListParams } from '@/src/lib/api/incidentReports';

export const useIncidentOverview = (estate_id: string, from_date?: string, to_date?: string) => {
  return useQuery({
    queryKey: ['incident-reports', 'overview', estate_id, from_date, to_date],
    queryFn: () => incidentReportsApi.getOverview({ estate_id, from_date, to_date }),
    enabled: !!estate_id,
    retry: 1,
    staleTime: 30_000,
  });
};

export const useIncidentReports = (
  estate_id: string,
  params?: Omit<IncidentReportsListParams, 'estate_id'>
) => {
  return useQuery({
    queryKey: ['incident-reports', 'reports', estate_id, params],
    queryFn: () => incidentReportsApi.getReports({ estate_id, ...params }),
    enabled: !!estate_id,
    placeholderData: keepPreviousData,
    retry: 1,
    staleTime: 30_000,
  });
};

export const useIncidentSummary = (
  estate_id: string,
  from_date?: string,
  to_date?: string,
  enabled = false
) => {
  return useQuery({
    queryKey: ['incident-reports', 'summary', estate_id, from_date, to_date],
    queryFn: () => incidentReportsApi.getSummary({ estate_id, from_date, to_date }),
    enabled: !!estate_id && enabled,
    retry: 1,
    // Keep prior report so remounting Result shows View instead of "Tap to generate".
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });
};
