import {
  nextPasswordFromMaskedInput,
  passwordDisplayValue,
} from '@/src/features/auth/utils/passwordMask';

describe('passwordDisplayValue', () => {
  it('shows the real password when visible', () => {
    expect(passwordDisplayValue('secret', true)).toBe('secret');
  });

  it('masks with asterisks when hidden', () => {
    expect(passwordDisplayValue('secret', false)).toBe('******');
  });
});

describe('nextPasswordFromMaskedInput', () => {
  it('passes through when visible', () => {
    expect(nextPasswordFromMaskedInput('ab', 'abc', true)).toBe('abc');
  });

  it('appends a typed character at the end', () => {
    expect(nextPasswordFromMaskedInput('ab', '**c', false)).toBe('abc');
  });

  it('truncates on backspace', () => {
    expect(nextPasswordFromMaskedInput('abc', '**', false)).toBe('ab');
  });

  it('replaces on a full paste without asterisks', () => {
    expect(nextPasswordFromMaskedInput('old', 'newpass', false)).toBe('newpass');
  });

  it('clears when the field is emptied', () => {
    expect(nextPasswordFromMaskedInput('abc', '', false)).toBe('');
  });
});
