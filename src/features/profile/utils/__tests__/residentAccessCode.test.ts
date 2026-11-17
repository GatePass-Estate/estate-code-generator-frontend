import {
  accessCodeDisplay,
  accessCodeExpiry,
  formatAccessCode,
} from '@/src/features/profile/utils/residentAccessCode';

describe('formatAccessCode', () => {
  it('strips whitespace and upper-cases', () => {
    expect(formatAccessCode(' ab1 2cd ')).toBe('AB12CD');
  });
});

describe('accessCodeDisplay', () => {
  it('shows dashes without a code', () => {
    expect(accessCodeDisplay(null, false, true)).toBe('------');
    expect(accessCodeDisplay('abc123', true, true)).toBe('------');
  });

  it('hides the code until revealed', () => {
    expect(accessCodeDisplay('abc123', false, false)).toBe('******');
    expect(accessCodeDisplay('abc 123', false, true)).toBe('ABC123');
  });
});

describe('accessCodeExpiry', () => {
  const now = new Date('2026-01-01T00:00:00Z');

  it('is empty without an expiry', () => {
    expect(accessCodeExpiry(null, now)).toEqual({ expiring: false, formattedDate: null });
  });

  it('flags codes 30 days or less from expiry', () => {
    expect(accessCodeExpiry('2026-01-31T00:00:00Z', now).expiring).toBe(true);
    expect(accessCodeExpiry('2026-03-01T00:00:00Z', now).expiring).toBe(false);
  });

  it('formats the date', () => {
    expect(accessCodeExpiry('2026-03-01T12:00:00Z', now).formattedDate).toEqual(expect.any(String));
  });
});
