import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  incidentReportsApi,
  type IncidentReportsListParams,
} from '@/src/features/ai/services/incidentReports';
import { queryKeys } from '@/src/shared/services/api/queryKeys';
import { INCIDENT_API_CATEGORIES } from '@/src/features/ai/components/incidents/categoryIcons';

/** OpenAPI taxonomy — show filter chips instantly while /categories loads. */
export const INCIDENT_CATEGORY_PLACEHOLDER = [...INCIDENT_API_CATEGORIES];

export const useIncidentOverview = (estate_id: string, from_date?: string, to_date?: string) => {
  return useQuery({
    queryKey: queryKeys.incidents.overview(estate_id, from_date, to_date),
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
    queryKey: queryKeys.incidents.reports(estate_id, params),
    queryFn: () => incidentReportsApi.getReports({ estate_id, ...params }),
    enabled: !!estate_id,
    placeholderData: keepPreviousData,
    retry: 1,
    staleTime: 30_000,
  });
};

/** Prefetch on Result so filter chips are ready when the modal opens. */
export const useIncidentCategories = (enabled = true) => {
  return useQuery({
    queryKey: queryKeys.incidents.categories(),
    queryFn: () => incidentReportsApi.getCategories(),
    enabled,
    retry: 1,
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
    placeholderData: INCIDENT_CATEGORY_PLACEHOLDER,
  });
};

export const useIncidentSummary = (
  estate_id: string,
  from_date?: string,
  to_date?: string,
  enabled = false
) => {
  return useQuery({
    queryKey: queryKeys.incidents.summary(estate_id, from_date, to_date),
    queryFn: () => incidentReportsApi.getSummary({ estate_id, from_date, to_date }),
    enabled: !!estate_id && enabled,
    retry: 1,
    // Keep prior report so remounting Result shows View instead of "Tap to generate".
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });
};
