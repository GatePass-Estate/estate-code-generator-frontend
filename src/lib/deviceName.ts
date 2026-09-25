/**
 * The sessions API stores whatever User-Agent the client sent, so `device_name`
 * arrives as a raw UA string ("Mozilla/5.0 (Macintosh; …)", "okhttp/4.12.0").
 * The Linked Devices design shows short platform names, so we normalise here.
 */

type Matcher = { label: string; test: RegExp };

// Order matters: the most specific patterns must win. iPadOS and Android both
// masquerade as other platforms in some UAs, so they are checked before the
// desktop families.
const MATCHERS: Matcher[] = [
  { label: 'iPhone', test: /iphone/i },
  { label: 'iPad', test: /ipad/i },
  { label: 'Android', test: /android|okhttp/i },
  { label: 'Mac', test: /macintosh|mac os x/i },
  { label: 'Windows', test: /windows|win32|win64/i },
  { label: 'Linux', test: /linux|x11/i },
];

/** Turns a stored User-Agent into a short, human device label. */
export function friendlyDeviceName(userAgent?: string | null): string {
  const ua = (userAgent ?? '').trim();
  if (!ua) return 'Unknown device';

  for (const { label, test } of MATCHERS) {
    if (test.test(ua)) return label;
  }

  // Expo/React Native native builds report a bare app identifier rather than a
  // browser UA; show it as-is when it is already short enough to read.
  if (ua.length <= 24) return ua;

  return 'Unknown device';
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Formats an ISO timestamp as "26 Jun 2026 at 12:00", matching the design. */
export function formatLastActive(iso?: string | null): string {
  if (!iso) return 'Unknown';

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Unknown';

  const day = date.getDate();
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day} ${month} ${year} at ${hours}:${minutes}`;
}
