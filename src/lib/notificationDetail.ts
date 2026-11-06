import type { Href } from 'expo-router';
import { friendlyDeviceName } from './deviceName';

export type DetailRow = { label: string; value: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Metadata keys worth showing, in display order.
 *
 * Anything not listed here is internal plumbing (record ids, session ids) that
 * means nothing to the person reading it, so it is left out.
 */
const DISPLAY_KEYS: { key: string; label: string }[] = [
  { key: 'device_name', label: 'Device' },
  { key: 'ip_address', label: 'IP address' },
  { key: 'requester_name', label: 'Requested by' },
  { key: 'request_type', label: 'Request type' },
  { key: 'estate_name', label: 'Estate' },
  { key: 'code', label: 'Access code' },
  { key: 'visitor_name', label: 'Visitor' },
  { key: 'reason', label: 'Reason' },
  { key: 'status', label: 'Status' },
];

/** "id_change" / "ID_CHANGE" -> "ID change". */
function humanize(value: string): string {
  const spaced = value.replace(/[_-]+/g, ' ').trim();
  if (!spaced) return value;
  // Uppercase "id" before sentence-casing, otherwise a leading "id" ends up as
  // "Id" (the capitalised first letter no longer matches the word boundary).
  const normalised = spaced.toLowerCase().replace(/\bid\b/g, 'ID');
  return normalised.charAt(0).toUpperCase() + normalised.slice(1);
}

/**
 * Turns a notification's metadata into labelled rows for the detail modal.
 *
 * Values that are bare UUIDs are dropped: several notification types put a raw
 * id in a name-shaped field (`requester_name`), and showing that to the user is
 * worse than showing nothing.
 */
export function metadataRows(metadata?: Record<string, unknown> | null): DetailRow[] {
  if (!metadata) return [];

  const rows: DetailRow[] = [];

  for (const { key, label } of DISPLAY_KEYS) {
    const raw = metadata[key];
    if (raw === null || raw === undefined) continue;

    const value = String(raw).trim();
    if (!value || UUID_RE.test(value)) continue;

    if (key === 'device_name') {
      rows.push({ label, value: friendlyDeviceName(value) });
    } else if (key === 'request_type' || key === 'status') {
      rows.push({ label, value: humanize(value) });
    } else {
      rows.push({ label, value });
    }
  }

  return rows;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "21 Sep 2026, 11:04" — the full timestamp shown in the detail modal. */
export function formatFullTimestamp(iso?: string | null): string {
  if (!iso) return '';

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}, ${hours}:${minutes}`;
}

/** Emitted by code_service when a scan is flagged; carries `prediction_result_id` in metadata. */
export const ANOMALY_NOTIFICATION_TYPE = 'SPATIAL_ANOMALY_DETECTED';

const ANOMALY_DETECTION_ROUTE = '/(protected)/(shared-screens)/ai-store/anomaly-detection';

/**
 * The flagged prediction's id, or null. Push data is stringified server-side, so a missing id can
 * arrive as the literal "None" (Python) or "null".
 */
export function anomalyPredictionId(metadata?: Record<string, unknown> | null): string | null {
  const raw = metadata?.prediction_result_id;
  if (raw === null || raw === undefined) return null;
  const value = String(raw).trim();
  if (!value || value === 'None' || value === 'null' || value === 'undefined') return null;
  return value;
}

/**
 * Where an anomaly notification leads: that prediction's detail page, or the anomaly-detection
 * results list when the notification doesn't say which prediction it was.
 */
export function anomalyRoute(metadata?: Record<string, unknown> | null): Href {
  const id = anomalyPredictionId(metadata);
  if (id) return `${ANOMALY_DETECTION_ROUTE}/user/${encodeURIComponent(id)}`;
  return { pathname: ANOMALY_DETECTION_ROUTE, params: { tab: 'Result' } };
}

/** Estate-level events that can change the plan (notification_service `NotificationType`). */
const PLAN_CHANGE_TYPES = new Set(['ESTATE_DEACTIVATED', 'ESTATE_REACTIVATED']);
const PLAN_CHANGE_PREFIXES = ['SUBSCRIPTION_', 'AI_GRANT_'];

/** True when a notification of this type means the estate's plan or entitlements may have changed. */
export function isPlanChangeNotification(type?: string | null): boolean {
  if (!type) return false;
  return PLAN_CHANGE_TYPES.has(type) || PLAN_CHANGE_PREFIXES.some((p) => type.startsWith(p));
}
