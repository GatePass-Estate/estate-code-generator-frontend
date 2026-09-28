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
