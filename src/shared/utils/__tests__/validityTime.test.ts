import {
  formatInviteClockTime,
  isUpcomingCode,
  parseLogDate,
  toUtcClock,
  utcClockToLocal,
} from '@/src/shared/utils/helpers';
import type { Codes } from '@/src/features/access-codes/types/codes';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const localClock = (date: Date) =>
  `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

describe('validity window clock', () => {
  it('round-trips a local time through the UTC clock the server compares with', () => {
    const local = new Date();
    local.setHours(14, 32, 0, 0);
    expect(utcClockToLocal(toUtcClock(local))).toBe('14:32');
  });

  it('shows a server window bound in local time', () => {
    const utc = new Date();
    utc.setUTCHours(13, 5, 0, 0);
    expect(formatInviteClockTime('13:05')).toBe(localClock(utc));
  });
});

describe('isUpcomingCode', () => {
  const codeStartingAt = (start: string) =>
    ({ validity_period: { start, end: '2099-01-01 00:00:00.000+0000' } }) as unknown as Codes;

  it('treats a start that already passed (true UTC) as active', () => {
    const past = new Date(Date.now() - 60_000);
    const stamp = past.toISOString().replace('T', ' ').replace('Z', '+0000');
    expect(isUpcomingCode(codeStartingAt(stamp))).toBe(false);
  });

  it('treats a start in the future as upcoming', () => {
    const future = new Date(Date.now() + 60 * 60_000);
    const stamp = future.toISOString().replace('T', ' ').replace('Z', '+0000');
    expect(isUpcomingCode(codeStartingAt(stamp))).toBe(true);
  });

  it('reads the server stamp as the same instant everywhere', () => {
    expect(parseLogDate('2026-07-25 13:00:00.000+0000').toISOString()).toBe(
      '2026-07-25T13:00:00.000Z'
    );
  });
});
