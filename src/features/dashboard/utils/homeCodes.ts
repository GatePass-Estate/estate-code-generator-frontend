import { Codes } from '@/src/features/access-codes/types/codes';
import { isUpcomingCode } from '@/src/shared/utils/helpers';

/** One row of the mobile Active Codes list. */
export type ActiveCodeRow = {
  item: Codes;
  expiresAt: number;
  startAt: number | null;
  frozen: boolean;
};

/** Codes shown on home: never expired ones; mobile also leaves upcoming codes to History. */
export function filterHomeCodes(items: Codes[], excludeUpcoming: boolean): Codes[] {
  return items.filter((code) => !code.is_expired && (!excludeUpcoming || !isUpcomingCode(code)));
}

/** API timestamps look like `2024-01-01 10:00:00+0100`; make them ISO before `new Date`. */
export function toIsoTimestamp(value: unknown): string {
  return String(value ?? '')
    .replace(' ', 'T')
    .replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
}

export function isCodeFrozen(code: Codes, frozenCodes: ReadonlySet<string>): boolean {
  return Boolean(code.frozen) || frozenCodes.has(code.hashed_code);
}

/** Frozen codes go last; otherwise the server order is kept. */
export function buildActiveCodeRows(
  codes: Codes[],
  frozenCodes: ReadonlySet<string>
): ActiveCodeRow[] {
  return [...codes]
    .sort((a, b) => {
      const aFrozen = isCodeFrozen(a, frozenCodes);
      const bFrozen = isCodeFrozen(b, frozenCodes);
      if (aFrozen === bFrozen) return 0;
      return aFrozen ? 1 : -1;
    })
    .map((item) => {
      const expiresAt = new Date(toIsoTimestamp(item.valid_until)).getTime();
      const startAt = item.validity_period?.start
        ? new Date(toIsoTimestamp(item.validity_period.start)).getTime()
        : null;
      return { item, expiresAt, startAt, frozen: isCodeFrozen(item, frozenCodes) };
    });
}

/** Frozen flag (and the server's validity, when it sent one) for one code. */
export function applyFrozen(
  codes: Codes[],
  hashedCode: string,
  frozen: boolean,
  isValid?: boolean
): Codes[] {
  return codes.map((c) =>
    c.hashed_code === hashedCode
      ? { ...c, frozen, ...(typeof isValid === 'boolean' ? { is_valid: isValid } : {}) }
      : c
  );
}

export function toggleInSet(set: ReadonlySet<string>, key: string, on: boolean): Set<string> {
  const next = new Set(set);
  if (on) next.add(key);
  else next.delete(key);
  return next;
}

type ExtendResult = {
  valid_until?: string | null;
  validity_period?: Codes['validity_period'] | null;
  extended?: boolean | null;
};

/** Merge an extend response into the list. */
export function applyExtension(codes: Codes[], hashedCode: string, res: ExtendResult): Codes[] {
  return codes.map((c) =>
    c.hashed_code === hashedCode
      ? {
          ...c,
          valid_until: res.valid_until || c.valid_until,
          validity_period: res.validity_period ?? c.validity_period,
          extended: res.extended ?? true,
        }
      : c
  );
}

/** Web card copy: `dd/mm/yyyy` and a one-hour window ending at expiry. */
export function webCodeWindow(
  validUntil: unknown,
  now = Date.now()
): { parsed: Date; formattedDate: string; timeframe: string } {
  const parsed = new Date(toIsoTimestamp(validUntil));
  let formattedDate = 'Invalid date';
  let timeframe = 'Unknown';

  if (!isNaN(parsed.getTime())) {
    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = parsed.getFullYear();
    formattedDate = `${day}/${month}/${year}`;

    const diffMs = parsed.getTime() - now;
    if (diffMs <= 0) {
      timeframe = 'Expired';
    } else {
      const startDate = new Date(parsed.getTime() - 60 * 60 * 1000);
      const formatTime = (d: Date) =>
        d
          .toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })
          .replace(/\s+/g, '')
          .toLowerCase();
      timeframe = `${formatTime(startDate)} to ${formatTime(parsed)}`;
    }
  }

  return { parsed, formattedDate, timeframe };
}

/** Gender variant for the web card: anything unknown shows the neutral icon. */
export function cardGender(gender: Codes['gender']): 'male' | 'female' | 'prefer_not_to_say' {
  return gender === 'male' || gender === 'female' ? gender : 'prefer_not_to_say';
}
