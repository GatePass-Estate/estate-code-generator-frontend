import type { BroadcastPriority } from '@/src/types/broadcast';

export type PriorityStyle = {
  /** Card background. */
  background: string;
  /** Card border. */
  border: string;
  /** Tinted circle behind the siren glyph. */
  circle: string;
  /** Siren glyph colour. */
  icon: string;
};

/** Palette taken from the Info Board design (one entry per API priority). */
const PRIORITY_STYLES: Record<BroadcastPriority, PriorityStyle> = {
  LOW: { background: '#F6F7F7', border: '#113E55', circle: '#CEE5ED', icon: '#113E55' },
  MEDIUM: { background: '#FBFBEE', border: '#B17000', circle: '#FFF8F5', icon: '#B17000' },
  HIGH: { background: '#FFF8F5', border: '#E30404', circle: '#FFF0EC', icon: '#E30404' },
};

export function priorityStyle(priority?: BroadcastPriority | null): PriorityStyle {
  return PRIORITY_STYLES[priority ?? 'LOW'] ?? PRIORITY_STYLES.LOW;
}

/**
 * Activity rows only distinguish "bad news" from everything else: the design
 * shows a red card for expiry/anomaly types and a plain white card otherwise.
 */
const ALERT_NOTIFICATION_TYPES = new Set([
  'SPATIAL_ANOMALY_DETECTED',
  'SESSION_REVOKED',
  'ACCOUNT_DEACTIVATED',
  'ACCOUNT_DEACTIVATION_SCHEDULED',
  'ESTATE_DEACTIVATED',
  'ESTATE_DEACTIVATION_SCHEDULED',
  'TWO_FA_RECOVERY_USED',
  'TWO_FA_DISABLED',
  'INCIDENT_REPORT_FILED',
]);

export function isAlertNotification(type?: string | null): boolean {
  return !!type && ALERT_NOTIFICATION_TYPES.has(type);
}

/** Compact age label ("3m", "2h", "5d") matching the design's trailing text. */
export function relativeTime(iso?: string | null): string {
  if (!iso) return '';

  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';

  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 60) return 'now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w`;

  return `${Math.floor(days / 365) >= 1 ? `${Math.floor(days / 365)}y` : `${Math.floor(days / 30)}mo`}`;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function ordinal(day: number): string {
  if (day > 3 && day < 21) return `${day}th`;
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}

/** "11th October, 2026." — the sent-date format on the expanded message. */
export function formatSentDate(iso?: string | null): string {
  if (!iso) return '';

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  return `${ordinal(date.getDate())} ${MONTHS[date.getMonth()]}, ${date.getFullYear()}.`;
}
