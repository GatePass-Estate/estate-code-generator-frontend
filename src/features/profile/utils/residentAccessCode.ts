import { formatDateWithOrdinal } from '@/src/shared/utils/helpers';

const DAY_MS = 1000 * 3600 * 24;

/** The code as shown and copied: no spaces, upper case. */
export function formatAccessCode(code: string) {
  return code.replace(/\s+/g, '').toUpperCase();
}

/** What the profile card shows: dashes without a code, stars while hidden, else the code. */
export function accessCodeDisplay(code: string | null, noCode: boolean, visible: boolean) {
  if (noCode || !code) return '------';
  if (!visible) return '******';
  return formatAccessCode(code);
}

/** Formatted expiry date, and whether it is 30 days away or less. */
export function accessCodeExpiry(
  expiry: string | null,
  now: Date = new Date()
): { expiring: boolean; formattedDate: string | null } {
  if (!expiry) return { expiring: false, formattedDate: null };
  const expDate = new Date(expiry);
  const daysLeft = (expDate.getTime() - now.getTime()) / DAY_MS;
  return { expiring: daysLeft <= 30, formattedDate: formatDateWithOrdinal(expDate) };
}
