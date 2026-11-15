import {
  codePromptCopy,
  isCurrentSession,
  isSixDigitCode,
  passwordChangeError,
  removeSession,
  sanitizeTotpInput,
} from '@/src/features/auth/utils/accountSecurity';

describe('sanitizeTotpInput', () => {
  it('keeps at most six digits', () => {
    expect(sanitizeTotpInput('12a 34-5678')).toBe('123456');
    expect(sanitizeTotpInput('abc')).toBe('');
  });
});

describe('isSixDigitCode', () => {
  it('accepts exactly six digits, ignoring surrounding spaces', () => {
    expect(isSixDigitCode('123456')).toBe(true);
    expect(isSixDigitCode(' 123456 ')).toBe(true);
    expect(isSixDigitCode('12345')).toBe(false);
    expect(isSixDigitCode('12345a')).toBe(false);
  });
});

describe('codePromptCopy', () => {
  it('describes turning 2FA off', () => {
    expect(codePromptCopy('disable')).toEqual({
      title: 'Turn off two-factor authentication',
      message: 'Enter the current code from your authenticator app to confirm.',
      confirmLabel: 'Turn off',
    });
  });

  it('describes regenerating recovery codes', () => {
    const copy = codePromptCopy('regenerate');
    expect(copy.title).toBe('Regenerate recovery codes');
    expect(copy.confirmLabel).toBe('Regenerate');
    expect(copy.message).toMatch(/previous recovery codes will stop working/);
  });
});

describe('isCurrentSession', () => {
  it('needs a known current session id', () => {
    expect(isCurrentSession('a', 'a')).toBe(true);
    expect(isCurrentSession('a', 'b')).toBe(false);
    expect(isCurrentSession('a', null)).toBe(false);
    expect(isCurrentSession('', '')).toBe(false);
  });
});

describe('removeSession', () => {
  it('drops one device and keeps the rest of the response', () => {
    const list = { items: [{ id: 'a' }, { id: 'b' }], total: 2 };
    expect(removeSession(list, 'a')).toEqual({ items: [{ id: 'b' }], total: 2 });
    expect(list.items).toHaveLength(2);
  });
});

describe('passwordChangeError', () => {
  const valid = {
    currentPassword: 'oldpassword',
    newPassword: 'newpassword',
    confirmPassword: 'newpassword',
  };

  it('accepts a valid change', () => {
    expect(passwordChangeError(valid)).toBe('');
  });

  it('checks the confirmation first, then length, then reuse', () => {
    expect(passwordChangeError({ ...valid, confirmPassword: 'other' })).toBe(
      'The new password and the confirm password do not match'
    );
    expect(passwordChangeError({ ...valid, newPassword: 'short', confirmPassword: 'short' })).toBe(
      'The password must be at least 8 characters long'
    );
    expect(passwordChangeError({ ...valid, currentPassword: 'short' })).toBe(
      'The password must be at least 8 characters long'
    );
    expect(
      passwordChangeError({
        currentPassword: 'samepassword',
        newPassword: 'samepassword',
        confirmPassword: 'samepassword',
      })
    ).toBe('The new password cannot be the same as the current password');
  });
});
