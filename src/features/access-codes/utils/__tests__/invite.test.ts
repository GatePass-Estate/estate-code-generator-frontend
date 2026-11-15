import {
  inviteShareMessage,
  inviteShareText,
  normalizeInviteCode,
  paramString,
} from '@/src/features/access-codes/utils/invite';

describe('invite helpers', () => {
  it('normalizes the code param', () => {
    expect(normalizeInviteCode(' ab c ')).toBe('abc');
    expect(normalizeInviteCode(['ab', ' cd'])).toBe('abcd');
    expect(normalizeInviteCode(undefined)).toBe('');
    expect(paramString(['a', 'b'])).toBe('ab');
  });

  it('builds the mobile share message', () => {
    expect(
      inviteShareMessage({
        name: 'Ada',
        address: '1 Road',
        date: '01/01/2030',
        timeframe: '1pm to 2pm',
        code: 'abc',
      })
    ).toBe(
      "You're invited!\n\nName: Ada\nAddress: 1 Road\nDate: 01/01/2030\nTime: 1pm to 2pm\nCode: abc"
    );
  });

  it('leaves empty details out of the web share text', () => {
    expect(inviteShareText({ name: 'Ada', date: '01/01/2030', code: 'abc' })).toBe(
      'Name: Ada\nDate: 01/01/2030\nAccess code: abc'
    );
  });
});
