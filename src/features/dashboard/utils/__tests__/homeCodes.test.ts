import { Codes } from '@/src/features/access-codes/types/codes';
import {
  applyExtension,
  applyFrozen,
  buildActiveCodeRows,
  cardGender,
  filterHomeCodes,
  toIsoTimestamp,
  toggleInSet,
  webCodeWindow,
} from '@/src/features/dashboard/utils/homeCodes';

function code(overrides: Partial<Codes> = {}): Codes {
  return {
    user_id: 'u1',
    estate_id: 'e1',
    visitor_fullname: 'Ada',
    relationship_with_resident: 'friend',
    hashed_code: 'abc',
    gender: 'female',
    valid_until: '2030-01-01 10:00:00+0000',
    is_expired: false,
    receiver: 'visitor',
    ...overrides,
  };
}

describe('toIsoTimestamp', () => {
  it('turns API timestamps into ISO strings', () => {
    expect(toIsoTimestamp('2030-01-01 10:00:00+0100')).toBe('2030-01-01T10:00:00+01:00');
    expect(toIsoTimestamp(undefined)).toBe('');
  });
});

describe('filterHomeCodes', () => {
  it('drops expired codes and, when asked, upcoming ones', () => {
    const now = Date.now();
    const upcoming = code({
      hashed_code: 'up',
      validity_period: {
        start: new Date(now + 86_400_000).toISOString(),
        end: new Date(now + 2 * 86_400_000).toISOString(),
      },
    });
    const items = [code(), code({ hashed_code: 'old', is_expired: true }), upcoming];
    expect(filterHomeCodes(items, false).map((c) => c.hashed_code)).toEqual(['abc', 'up']);
    expect(filterHomeCodes(items, true).map((c) => c.hashed_code)).toEqual(['abc']);
  });
});

describe('buildActiveCodeRows', () => {
  it('puts frozen codes last and keeps times', () => {
    const rows = buildActiveCodeRows(
      [
        code({ hashed_code: 'a', frozen: true }),
        code({ hashed_code: 'b' }),
        code({ hashed_code: 'c' }),
      ],
      new Set(['c'])
    );
    expect(rows.map((r) => [r.item.hashed_code, r.frozen])).toEqual([
      ['b', false],
      ['a', true],
      ['c', true],
    ]);
    expect(rows[0].expiresAt).toBe(Date.parse('2030-01-01T10:00:00+00:00'));
    expect(rows[0].startAt).toBeNull();
  });
});

describe('row updates', () => {
  it('applyFrozen sets frozen and only a boolean validity', () => {
    const [updated] = applyFrozen([code()], 'abc', true);
    expect(updated.frozen).toBe(true);
    expect('is_valid' in updated).toBe(false);
    expect(applyFrozen([code()], 'abc', false, false)[0].is_valid).toBe(false);
    expect(applyFrozen([code()], 'other', true)[0].frozen).toBeUndefined();
  });

  it('toggleInSet adds and removes without mutating', () => {
    const start = new Set(['a']);
    expect([...toggleInSet(start, 'b', true)]).toEqual(['a', 'b']);
    expect([...toggleInSet(start, 'a', false)]).toEqual([]);
    expect([...start]).toEqual(['a']);
  });

  it('applyExtension keeps old values when the response omits them', () => {
    const [kept] = applyExtension([code()], 'abc', { valid_until: '' });
    expect(kept.valid_until).toBe('2030-01-01 10:00:00+0000');
    expect(kept.extended).toBe(true);
    const [changed] = applyExtension([code()], 'abc', {
      valid_until: '2031-01-01 10:00:00+0000',
      extended: false,
    });
    expect(changed.valid_until).toBe('2031-01-01 10:00:00+0000');
    expect(changed.extended).toBe(false);
  });
});

describe('webCodeWindow', () => {
  it('formats the date and a one-hour window', () => {
    const until = new Date(2030, 0, 2, 15, 30);
    const result = webCodeWindow(until.toISOString(), until.getTime() - 1000);
    expect(result.formattedDate).toBe('02/01/2030');
    expect(result.timeframe).toMatch(/^2:30pm to 3:30pm$/);
  });

  it('marks past codes expired and bad dates invalid', () => {
    expect(webCodeWindow('2020-01-01 10:00:00+0000').timeframe).toBe('Expired');
    expect(webCodeWindow('nope')).toMatchObject({
      formattedDate: 'Invalid date',
      timeframe: 'Unknown',
    });
  });
});

describe('cardGender', () => {
  it('falls back to the neutral variant', () => {
    expect(cardGender('male')).toBe('male');
    expect(cardGender(null)).toBe('prefer_not_to_say');
  });
});
