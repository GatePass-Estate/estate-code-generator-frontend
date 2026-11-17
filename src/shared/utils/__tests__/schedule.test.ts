import {
  formatAccessLogTimestamp,
  formatGeneratedOnDate,
  formatPastHistoryVisitDate,
  groupLogsByMonth,
  parseLogDate,
} from '@/src/shared/utils/schedule';

// History shows the same local time as the invite screens (device zone, e.g. WAT = UTC+1, where a
// 00:35 visit must not show on the previous UTC day). Expectations are built from local getters so
// the suite passes in any zone; ``TZ=Africa/Lagos npx jest`` exercises the WAT case directly.
const months = [
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
const pad = (n: number) => String(n).padStart(2, '0');
const isWat = new Date('2026-07-14T23:35:00Z').getHours() === 0;

describe('parseLogDate', () => {
  it('reads zoned API stamps as the same instant', () => {
    expect(parseLogDate('2026-07-14T23:35:33.854563Z').toISOString()).toBe(
      '2026-07-14T23:35:33.854Z'
    );
    expect(parseLogDate('2026-07-25 13:00:00.000+0000').toISOString()).toBe(
      '2026-07-25T13:00:00.000Z'
    );
  });

  it('reads a datetime without a zone as UTC, not device time', () => {
    expect(parseLogDate('2026-07-14T23:35:33').toISOString()).toBe('2026-07-14T23:35:33.000Z');
    expect(parseLogDate('2026-07-14 23:35:33.123456').toISOString()).toBe(
      '2026-07-14T23:35:33.123Z'
    );
  });
});

describe('history dates in local time', () => {
  const stamp = '2026-07-14T23:35:33.854563Z';
  const local = new Date('2026-07-14T23:35:33.854Z');

  it('formats the visit with local calendar fields', () => {
    expect(formatPastHistoryVisitDate(stamp)).toMatch(
      new RegExp(`^${local.getDate()}(st|nd|rd|th) ${months[local.getMonth()]} 2026$`)
    );
    expect(formatAccessLogTimestamp(parseLogDate(stamp))).toBe(
      `${local.getDate()} ${months[local.getMonth()]} 2026, ${pad(local.getHours())}:${pad(local.getMinutes())}`
    );
    expect(formatGeneratedOnDate(parseLogDate(stamp))).toMatch(
      new RegExp(`^${local.getDate()}(st|nd|rd|th) of ${months[local.getMonth()]}$`)
    );
  });

  (isWat ? it : it.skip)('shows a 00:35 WAT visit on the local day (TZ=Africa/Lagos)', () => {
    expect(formatPastHistoryVisitDate(stamp)).toBe('15th July 2026');
    expect(formatAccessLogTimestamp(parseLogDate(stamp))).toBe('15 July 2026, 00:35');
    expect(formatGeneratedOnDate(parseLogDate(stamp))).toBe('15th of July');
  });

  it('groups by the local month', () => {
    const logs = [{ t: '2026-07-31T23:30:00Z' }, { t: '2026-07-15T10:00:00Z' }];
    const lateJuly = new Date(logs[0].t);
    const label = lateJuly.toLocaleString('en-US', { month: 'long' }).toUpperCase();
    const groups = groupLogsByMonth(logs, (log) => log.t);
    expect(groups[0].label).toBe(label);
    expect(groups.flatMap((group) => group.items)).toHaveLength(2);
  });

  it('keeps empty and unparseable values readable', () => {
    expect(formatPastHistoryVisitDate(null)).toBe('—');
    expect(formatPastHistoryVisitDate('not a date')).toBe('not a date');
  });
});
