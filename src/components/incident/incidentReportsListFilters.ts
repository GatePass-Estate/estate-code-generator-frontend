import type { IncidentReportsListParams } from '@/src/lib/api/incidentReports';

type CachedFilters = Omit<IncidentReportsListParams, 'estate_id' | 'page' | 'limit'>;

let cached: CachedFilters = {};

/** Persist Result-tab filters so the full reports list can reuse them. */
export function setIncidentReportsListFilters(filters: CachedFilters) {
  cached = { ...filters };
}

export function getIncidentReportsListFilters(): CachedFilters {
  return { ...cached };
}
