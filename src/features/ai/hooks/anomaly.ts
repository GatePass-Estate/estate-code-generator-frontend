import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { anomalyApi } from '@/src/features/ai/services/anomaly';
import { normalizeAnomalyPredictions } from '@/src/features/ai/utils/anomalyShapes';
import { queryKeys } from '@/src/shared/services/api/queryKeys';

export const useAnomalyOverview = (estate_id: string, from_date?: string, to_date?: string) => {
  return useQuery({
    queryKey: queryKeys.anomaly.overview(estate_id, from_date, to_date),
    queryFn: () => anomalyApi.getOverview({ estate_id, from_date, to_date }),
    enabled: !!estate_id,
    staleTime: 0,
    refetchOnMount: 'always',
  });
};

export const useAnomalyPredictions = (
  estate_id: string,
  params?: {
    from_date?: string;
    to_date?: string;
    severity?: string[];
    gender?: string[];
    user_type?: string[];
    sort_order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }
) => {
  return useQuery({
    queryKey: queryKeys.anomaly.predictions(estate_id, params),
    queryFn: () => anomalyApi.getPredictions({ estate_id, ...params }),
    enabled: !!estate_id,
    staleTime: 0,
    refetchOnMount: 'always',
    placeholderData: keepPreviousData,
    select: normalizeAnomalyPredictions,
  });
};

export const useAnomalyCaseDemographic = (estate_id: string, prediction_id: string) => {
  return useQuery({
    queryKey: queryKeys.anomaly.caseDemographic(estate_id, prediction_id),
    queryFn: () => anomalyApi.getCaseDemographic(estate_id, prediction_id),
    enabled: !!estate_id && !!prediction_id,
    staleTime: 0,
    refetchOnMount: 'always',
  });
};

export const useAnomalyCaseHistory = (estate_id: string, prediction_id: string) => {
  return useQuery({
    queryKey: queryKeys.anomaly.caseHistory(estate_id, prediction_id),
    queryFn: () => anomalyApi.getCaseHistory(estate_id, prediction_id),
    enabled: !!estate_id && !!prediction_id,
    staleTime: 0,
    refetchOnMount: 'always',
  });
};

export const useAnomalyCaseSummary = (
  estate_id: string,
  prediction_id: string,
  enabled: boolean = false
) => {
  return useQuery({
    queryKey: queryKeys.anomaly.caseSummary(estate_id, prediction_id),
    queryFn: () => anomalyApi.getCaseSummary(estate_id, prediction_id),
    enabled: !!estate_id && !!prediction_id && enabled,
  });
};

export const useAnomalyCaseResults = (
  estate_id: string,
  prediction_id: string,
  from_date?: string,
  to_date?: string
) => {
  return useQuery({
    queryKey: queryKeys.anomaly.caseResults(estate_id, prediction_id, from_date, to_date),
    queryFn: () => anomalyApi.getCaseResults(estate_id, prediction_id, from_date, to_date),
    enabled: !!estate_id && !!prediction_id,
    staleTime: 0,
    refetchOnMount: 'always',
  });
};
