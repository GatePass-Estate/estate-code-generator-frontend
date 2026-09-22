import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { anomalyApi } from '@/src/lib/api/anomaly';

export const useAnomalyOverview = (estate_id: string, from_date?: string, to_date?: string) => {
  return useQuery({
    queryKey: ['anomaly', 'overview', estate_id, from_date, to_date],
    queryFn: () => anomalyApi.getOverview({ estate_id, from_date, to_date }),
    enabled: !!estate_id,
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
    queryKey: ['anomaly', 'predictions', estate_id, params],
    queryFn: () => anomalyApi.getPredictions({ estate_id, ...params }),
    enabled: !!estate_id,
    placeholderData: keepPreviousData,
  });
};

export const useAnomalyCaseDemographic = (estate_id: string, prediction_id: string) => {
  return useQuery({
    queryKey: ['anomaly', 'case-demographic', estate_id, prediction_id],
    queryFn: () => anomalyApi.getCaseDemographic(estate_id, prediction_id),
    enabled: !!estate_id && !!prediction_id,
  });
};

export const useAnomalyCaseHistory = (estate_id: string, prediction_id: string) => {
  return useQuery({
    queryKey: ['anomaly', 'case-history', estate_id, prediction_id],
    queryFn: () => anomalyApi.getCaseHistory(estate_id, prediction_id),
    enabled: !!estate_id && !!prediction_id,
  });
};

export const useAnomalyCaseSummary = (estate_id: string, prediction_id: string, enabled: boolean = false) => {
  return useQuery({
    queryKey: ['anomaly', 'case-summary', estate_id, prediction_id],
    queryFn: () => anomalyApi.getCaseSummary(estate_id, prediction_id),
    enabled: !!estate_id && !!prediction_id && enabled,
  });
};

export const useAnomalyCaseResults = (estate_id: string, prediction_id: string, from_date?: string, to_date?: string) => {
  return useQuery({
    queryKey: ['anomaly', 'case-results', estate_id, prediction_id, from_date, to_date],
    queryFn: () => anomalyApi.getCaseResults(estate_id, prediction_id, from_date, to_date),
    enabled: !!estate_id && !!prediction_id,
  });
};
