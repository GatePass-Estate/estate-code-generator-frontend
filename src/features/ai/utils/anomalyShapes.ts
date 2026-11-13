import { GaugeData } from '@/src/features/ai/components/anomaly/modals/GaugeDetailModal';
import {
  AnomalyCaseDemographicResponse,
  AnomalyCaseHistoryRecord,
  AnomalyCaseResultsResponse,
  AnomalyCaseSummaryResponse,
  AnomalyOverviewResponse,
  AnomalyPrediction,
} from '@/src/features/ai/services/anomaly';

/** Plot and factor rows include the aliases the charts already read. */
export interface AnomalyPlotPoint {
  feature_name?: string;
  name?: string;
  label?: string;
  description?: string;
  weight?: number | null;
  normal_value?: number;
  scale?: number;
  percentage?: number;
  instance_percentage?: number;
  instance_value?: number;
}

export interface AnomalyFactor {
  name?: string;
  feature_name?: string;
  label?: string;
  description?: string;
  weight?: number | null;
  percentage?: number;
  sub_factors?: AnomalyFactor[];
}

export type AnomalyOverviewView = Partial<AnomalyOverviewResponse> & {
  data?: AnomalyOverviewView;
  anomaly_overview?: {
    spider_plot?: AnomalyPlotPoint[];
    top_contributing_factors?: AnomalyFactor[];
    contributing_factors?: AnomalyFactor[];
  };
};

export type AnomalyDemographicView = Partial<AnomalyCaseDemographicResponse> & {
  data?: AnomalyDemographicView;
  role?: string;
  gender?: string;
  name?: string;
  avatar_url?: string;
};

export type AnomalyHistoryView = {
  data?: AnomalyCaseHistoryRecord[] | AnomalyHistoryView;
  items?: AnomalyCaseHistoryRecord[];
  total?: number;
};

export type AnomalyResultsView = Partial<AnomalyCaseResultsResponse> & {
  data?: AnomalyResultsView;
  anomaly_overview?: {
    spider_plot?: AnomalyPlotPoint[];
    contributing_factors?: AnomalyFactor[];
  };
};

export type AnomalySummaryTier = {
  executive_summary?: string;
  detailed_insight?: string;
  risk_drivers?: string[];
  recommended_actions?: string[];
  data_limitations?: string;
};

export type AnomalySummaryView = Partial<AnomalyCaseSummaryResponse> & {
  data?: AnomalySummaryView;
  tier1?: AnomalySummaryTier;
  tier2?: AnomalySummaryTier;
};

export type AnomalyPredictionRow = AnomalyPrediction & {
  prediction_id?: string;
  user_id?: string;
  role?: string;
  name?: string;
};

export function unwrapAnomalyPayload<T>(
  value: (T & { data?: T | null }) | null | undefined
): T | undefined {
  if (value == null) return undefined;
  if (typeof value === 'object' && 'data' in value && value.data) return value.data;
  return value;
}

export function anomalyHistoryRecords(history: unknown): AnomalyCaseHistoryRecord[] {
  if (Array.isArray(history)) return history as AnomalyCaseHistoryRecord[];
  if (!history || typeof history !== 'object') return [];
  const body = history as AnomalyHistoryView;
  if (Array.isArray(body.data)) return body.data;
  if (body.data && typeof body.data === 'object' && !Array.isArray(body.data)) {
    const nested = anomalyHistoryRecords(body.data);
    if (nested.length > 0 || Array.isArray((body.data as AnomalyHistoryView).items)) return nested;
  }
  return body.items ?? [];
}

export function anomalyHistoryTotal(history: unknown, recordsLength: number): number {
  if (!history || typeof history !== 'object' || Array.isArray(history)) return recordsLength;
  const total = (history as AnomalyHistoryView).total;
  return typeof total === 'number' ? total : recordsLength;
}

export function anomalyPlotLabel(point: AnomalyPlotPoint): string {
  if (point.label) return point.label;
  const raw = point.name || point.feature_name || 'Unknown';
  return raw
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const GAUGE_COLORS = ['#F46036', '#1B998B', '#113E55', '#D97706'];

function formatFactorTitle(factor: AnomalyFactor, fallback: string): string {
  const raw = factor.name || factor.feature_name || fallback;
  return factor.label || anomalyPlotLabel({ feature_name: raw });
}

/** Case gauges. Weight falls back to percentage and always prints zero decimal places. */
export function buildCaseGauges(
  factors: AnomalyFactor[] | undefined,
  records: number,
  days: number
): GaugeData[] {
  if (!factors?.length) return [];
  return factors.map((factor, index) => {
    const percentage = factor.percentage || 0;
    const themeColor = GAUGE_COLORS[index % GAUGE_COLORS.length];
    const weight = factor.weight !== undefined ? factor.weight : factor.percentage;
    const formattedWeight =
      weight != null ? `${Number(weight).toFixed(weight === 0 ? 0 : 0)}%` : '-';
    return {
      title: formatFactorTitle(factor, 'Unknown Factor'),
      description: factor.description || '',
      percentage,
      weightLabel: formattedWeight,
      color: themeColor,
      arcColor: themeColor,
      records,
      days,
      items: (factor.sub_factors || []).map((sf) => ({
        title: formatFactorTitle(sf, 'Sub-factor'),
        description: sf.description || '',
        percentage: sf.percentage || 0,
        value:
          sf.weight != null
            ? sf.weight
            : sf.percentage != null
              ? `${Math.round(sf.percentage)}%`
              : '-',
      })),
    };
  });
}

/** Estate overview gauges. Weight is printed with two decimal places and has no percentage fallback. */
export function buildOverviewGauges(
  overview: AnomalyOverviewView | undefined,
  records: number,
  days: number
): GaugeData[] {
  const factors =
    overview?.anomaly_overview?.contributing_factors ||
    overview?.anomaly_overview?.top_contributing_factors;
  if (!factors?.length) return [];
  return factors.map((factor, index) => {
    const percentage = factor.percentage || 0;
    const themeColor = GAUGE_COLORS[index % GAUGE_COLORS.length];
    const weight = factor.weight;
    const formattedWeight =
      weight != null ? `${Number(weight).toFixed(weight === 0 ? 0 : 2)}%` : '-';
    return {
      title: formatFactorTitle(factor, 'Unknown Factor'),
      description: factor.description || '',
      percentage,
      weightLabel: formattedWeight,
      color: themeColor,
      arcColor: themeColor,
      records,
      days,
      items: (factor.sub_factors || []).map((sf) => ({
        title: formatFactorTitle(sf, 'Sub-factor'),
        description: sf.description || '',
        percentage: sf.percentage || 0,
        value: sf.weight != null ? sf.weight : '-',
      })),
    };
  });
}

export function normalizeAnomalyPredictions(data: unknown): {
  predictionsArray: AnomalyPredictionRow[];
  totalPredictionsCount: number;
} {
  const record = data && typeof data === 'object' ? (data as { data?: unknown }) : undefined;
  const actual = record?.data || data;
  const items = Array.isArray(actual)
    ? (actual as AnomalyPredictionRow[])
    : (((actual as { items?: unknown; predictions?: unknown; results?: unknown } | null)?.items ||
        (actual as { predictions?: unknown }).predictions ||
        (actual as { results?: unknown }).results ||
        []) as AnomalyPredictionRow[]);
  const body =
    actual && typeof actual === 'object' && !Array.isArray(actual)
      ? (actual as { total?: unknown; count?: unknown })
      : undefined;
  const total =
    typeof body?.total === 'number'
      ? body.total
      : typeof body?.count === 'number'
        ? body.count
        : items.length;
  return { predictionsArray: items, totalPredictionsCount: total };
}
