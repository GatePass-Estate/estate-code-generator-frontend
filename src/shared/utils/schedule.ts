export const ordinalSuffix = (day: number): string => {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
};

const monthNames = [
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

export const formatDateWithOrdinal = (date: Date): string => {
  const d = date.getDate();
  const m = monthNames[date.getMonth()];
  const y = date.getFullYear();
  return `${d}${ordinalSuffix(d)} ${m} ${y}`;
};

/**
 * Parse API datetime strings that may use a space separator or offset without a colon.
 * The API stores UTC, so a datetime with no zone (``2026-07-25T14:00:00``) is read as UTC rather
 * than the device's local time. Callers format the resulting instant in local time.
 */
export const parseLogDate = (value: string): Date => {
  // ``2026-07-25 14:00:00.000+0000`` → ``2026-07-25T14:00:00.000+00:00``
  let iso = value
    .trim()
    .replace(' ', 'T')
    .replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
  if (/T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(iso)) iso += 'Z';
  return new Date(iso);
};

export const logDateMs = (value: string): number => {
  const time = parseLogDate(value).getTime();
  return Number.isFinite(time) ? time : 0;
};

/** Newest timestamp first. Equal (or unparseable) times keep their original order. */
export const compareLogDatesDesc = (a: string, b: string): number => logDateMs(b) - logDateMs(a);

/**
 * Past history card — local calendar day of ``visit_time`` (date only; time is on details),
 * matching the invite screens. e.g. ``2026-07-14T23:35:33.854563Z`` → ``15th July 2026`` in WAT
 */
export const formatPastHistoryVisitDate = (value?: string | null): string => {
  if (!value) return '—';
  const date = parseLogDate(value);
  if (Number.isNaN(date.getTime())) return value;
  return formatDateWithOrdinal(date);
};

/**
 * Upcoming history card — local time of ``validity_period.start``
 * e.g. ``2026-07-25 13:00:00.000+0000`` → ``25 July 14:00`` in WAT
 */
export const formatUpcomingInviteCardDate = (value?: string | null): string => {
  if (!value) return 'Scheduled';
  const date = parseLogDate(value);
  if (Number.isNaN(date.getTime())) return value;
  const day = date.getDate();
  const month = date.toLocaleString('en-GB', { month: 'long' });
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${hours}:${minutes}`;
};

/** ``HH:MM`` of a local time, as the UTC time of day the server compares validity windows with. */
export const toUtcClock = (date: Date): string =>
  `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`;

/** A server ``HH:MM`` (UTC time of day) shown as the local ``HH:MM``. */
export const utcClockToLocal = (value: string): string => {
  const [h, m] = value.split(':').map(Number);
  const date = new Date();
  date.setUTCHours(h, m, 0, 0);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

/** True when the invite's validity window has not started yet (History → Upcoming). */
export function isUpcomingCode(
  code: { validity_period?: { start?: string | null } | null },
  now = Date.now()
): boolean {
  const start = code.validity_period?.start;
  if (!start) return false;
  const startMs = parseLogDate(start).getTime();
  return Number.isFinite(startMs) && startMs > now;
}

/**
 * Upcoming invite detail — local calendar date
 * e.g. ``2026-07-25 13:00:00.000+0000`` → ``Saturday, 25 July 2026``
 */
export const formatInviteScheduleDate = (value?: string | null): string => {
  if (!value) return '—';
  const date = parseLogDate(value);
  if (Number.isNaN(date.getTime())) return value;
  const weekday = date.toLocaleString('en-GB', { weekday: 'long' });
  const day = date.getDate();
  const month = date.toLocaleString('en-GB', { month: 'long' });
  const year = date.getFullYear();
  return `${weekday}, ${day} ${month} ${year}`;
};

/**
 * Upcoming invite clock, in local time. A bare ``HH:MM`` is a validity-window bound (UTC time of
 * day); a datetime is a UTC instant.
 * e.g. ``13:00`` or ``2026-07-25 13:00:00.000+0000`` → ``14:00`` in WAT
 */
export const formatInviteClockTime = (value?: string | null): string => {
  if (!value) return '—';
  const trimmed = value.trim();
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(trimmed)) return utcClockToLocal(trimmed);
  const date = parseLogDate(trimmed);
  if (Number.isNaN(date.getTime())) return trimmed;
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

export type MonthGroup<T> = {
  label: string;
  items: T[];
};

function monthGroupKey(date: Date, utc: boolean): string {
  const year = utc ? date.getUTCFullYear() : date.getFullYear();
  const month = utc ? date.getUTCMonth() : date.getMonth();
  return `${year}-${String(month).padStart(2, '0')}`;
}

function compareMonthKeysDesc(a: string, b: string): number {
  const [aYear, aMonth] = a.split('-').map(Number);
  const [bYear, bMonth] = b.split('-').map(Number);
  return bYear - aYear || bMonth - aMonth;
}

/** Group items by calendar month (newest month first; items newest-first within each month). */
export function groupLogsByMonth<T>(
  logs: T[],
  getDate: (item: T) => string,
  options?: { utc?: boolean }
): MonthGroup<T>[] {
  const useUtc = options?.utc ?? false;
  const groups = new Map<string, T[]>();

  logs.forEach((log) => {
    const key = monthGroupKey(parseLogDate(getDate(log)), useUtc);
    const existing = groups.get(key) ?? [];
    existing.push(log);
    groups.set(key, existing);
  });

  return Array.from(groups.entries())
    .sort(([a], [b]) => compareMonthKeysDesc(a, b))
    .map(([key, items]) => {
      const [year, month] = key.split('-').map(Number);
      const label = useUtc
        ? new Date(Date.UTC(year, month, 1))
            .toLocaleString('en-US', { month: 'long', timeZone: 'UTC' })
            .toUpperCase()
        : new Date(year, month, 1).toLocaleString('en-US', { month: 'long' }).toUpperCase();

      return {
        label,
        items: [...items].sort((a, b) => compareLogDatesDesc(getDate(a), getDate(b))),
      };
    });
}

/** Access log card "Generated:" label — local calendar day of API ``created_at``. */
export const formatGeneratedOnDate = (date: Date): string => {
  const d = date.getDate();
  const m = monthNames[date.getMonth()];
  return `${d}${ordinalSuffix(d)} of ${m}`;
};

/** Access-log timestamps in local time, like the invite screens (API values are UTC instants). */
export const formatAccessLogTimestamp = (date: Date): string => {
  const d = date.getDate();
  const m = monthNames[date.getMonth()];
  const y = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${d} ${m} ${y}, ${hours}:${minutes}`;
};

export const formatAccessCodeWithSpace = (code: string): string => {
  const cleaned = code.replace(/\s+/g, '').toUpperCase();
  if (cleaned.length <= 3) return cleaned;
  const mid = Math.ceil(cleaned.length / 2);
  return `${cleaned.slice(0, mid)} ${cleaned.slice(mid)}`;
};

export const timeCalc = (
  valid_until: string | Date | undefined
): {
  formattedDate: string;
  timeframe: string;
  timeLeftMinutes: number;
} => {
  const iso = String(valid_until ?? '')
    .replace(' ', 'T')
    .replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
  const parsed = new Date(iso);

  let formattedDate = 'Invalid date';
  let timeframe = 'Unknown';
  let timeLeftMinutes = 0;

  if (!isNaN(parsed.getTime())) {
    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = parsed.getFullYear();
    formattedDate = `${day}/${month}/${year}`;

    const diffMs = parsed.getTime() - Date.now();
    if (diffMs <= 0) {
      timeframe = 'Expired';
    } else {
      const startDate = new Date(parsed.getTime() - 60 * 60 * 1000);
      const formatTime = (d: Date) =>
        d
          .toLocaleTimeString(undefined, {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })
          .replace(/\s+/g, '')
          .toLowerCase();
      timeLeftMinutes = Math.floor((diffMs % 3600000) / 60000);
      timeframe = `${formatTime(startDate)} to ${formatTime(parsed)}`;
    }
  }

  return { formattedDate, timeframe, timeLeftMinutes };
};

/**
 * Invite details from the actual start/end the user selected (local picker values).
 * Prefer this over ``timeCalc(valid_until)``, which invents a 1-hour window from the end only.
 */
export const formatInvitePeriodDisplay = (
  start: Date,
  end: Date
): { formattedDate: string; timeframe: string } => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const formatDate = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  const formatTime = (d: Date) =>
    d
      .toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
      .replace(/\s+/g, '')
      .toLowerCase();

  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  return {
    formattedDate: sameDay ? formatDate(start) : `${formatDate(start)} - ${formatDate(end)}`,
    timeframe: `${formatTime(start)} to ${formatTime(end)}`,
  };
};
