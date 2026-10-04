import type { IncidentRow } from '@/src/components/incident/incidentTypes';

export type IncidentDetailPayload = {
  id: string;
  title: string;
  category: string;
  narrative: string;
  /** Display date like "11th October, 2026" */
  reportedLabel: string;
};

const cache = new Map<string, IncidentDetailPayload>();

export function cacheIncidentDetail(detail: IncidentDetailPayload) {
  cache.set(detail.id, detail);
}

export function getCachedIncidentDetail(id: string): IncidentDetailPayload | undefined {
  return cache.get(id);
}

export function cacheIncidentDetailFromRow(
  row: IncidentRow & { narrative?: string; reportedLabel?: string }
) {
  cacheIncidentDetail({
    id: row.id,
    title: row.title,
    category: row.category,
    narrative: row.narrative ?? '',
    reportedLabel: row.reportedLabel ?? row.reportedAt,
  });
}

/** e.g. 11th October, 2026 */
export function formatIncidentLongDate(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return '';
  const day = d.getDate();
  const suffix =
    day % 10 === 1 && day !== 11
      ? 'st'
      : day % 10 === 2 && day !== 12
        ? 'nd'
        : day % 10 === 3 && day !== 13
          ? 'rd'
          : 'th';
  const month = d.toLocaleString('en-GB', { month: 'long' });
  return `${day}${suffix} ${month}, ${d.getFullYear()}`;
}
