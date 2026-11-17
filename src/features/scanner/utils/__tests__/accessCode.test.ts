import {
  cleanCodeInput,
  extractScannedAccessCode,
  guestDetailsFromValidation,
  isRejectedValidation,
  normalizeAccessCode,
  passwordChangeError,
  withResidentDetails,
} from '@/src/features/scanner/utils/accessCode';

describe('cleanCodeInput', () => {
  it('keeps letters and digits, upper-cased', () => {
    expect(cleanCodeInput('ab-1 c!2')).toBe('AB1C2');
  });
});

describe('isRejectedValidation', () => {
  it('rejects frozen (is_valid false) and expired codes', () => {
    expect(isRejectedValidation({ is_valid: false, is_expired: false })).toBe(true);
    expect(isRejectedValidation({ is_valid: true, is_expired: true })).toBe(true);
  });

  it('accepts a valid code, including when is_valid is missing', () => {
    expect(isRejectedValidation({ is_valid: true, is_expired: false })).toBe(false);
    expect(isRejectedValidation({ is_expired: false })).toBe(false);
  });
});

describe('normalizeAccessCode', () => {
  it('returns six upper-cased characters or an empty string', () => {
    expect(normalizeAccessCode('abc-123')).toBe('ABC123');
    expect(normalizeAccessCode('abc12')).toBe('');
    expect(normalizeAccessCode(null)).toBe('');
  });
});

describe('extractScannedAccessCode', () => {
  it('reads plain codes', () => {
    expect(extractScannedAccessCode(' abc123 ')).toBe('ABC123');
  });

  it('reads JSON payloads', () => {
    expect(extractScannedAccessCode('{"access_code":"xy9 8z7"}')).toBe('XY98Z7');
  });

  it('reads URL query and path codes', () => {
    expect(extractScannedAccessCode('https://gatepass.app/v?code=QWE123')).toBe('QWE123');
    expect(extractScannedAccessCode('https://gatepass.app/codes/ZXC789')).toBe('ZXC789');
  });

  it('reads labelled and grouped codes', () => {
    expect(extractScannedAccessCode('CODE:ab12-34')).toBe('AB1234');
    expect(extractScannedAccessCode('Pass: ABC-123')).toBe('ABC123');
  });

  it('returns an empty string when there is no code', () => {
    expect(extractScannedAccessCode('hello')).toBe('');
  });
});

describe('guest details', () => {
  const base = guestDetailsFromValidation({
    visitor_fullname: null,
    relationship_with_resident: 'friend',
    gender: 'male',
    hashed_code: 'ABC123',
    receiver: 'resident',
  });

  it('builds the invite details with empty resident fields', () => {
    expect(base).toEqual({
      visitor_fullname: '',
      relationship_with_resident: 'friend',
      gender: 'male',
      resident_name: '',
      resident_address: '',
      resident_email: '',
      resident_phone_number: '',
      code: 'ABC123',
      isResident: true,
    });
  });

  it('fills resident details', () => {
    expect(
      withResidentDetails(base, {
        first_name: 'Ada',
        last_name: null,
        home_address: '1 Road',
        email: 'a@b.c',
        phone_number: null,
      })
    ).toMatchObject({
      resident_name: 'Ada',
      resident_address: '1 Road',
      resident_email: 'a@b.c',
      resident_phone_number: '',
    });
  });
});

describe('passwordChangeError', () => {
  it('checks confirmation, length and reuse in that order', () => {
    expect(passwordChangeError('oldpass12', 'newpass12', 'other')).toBe(
      'New Password and Confirm Password do not match'
    );
    expect(passwordChangeError('short', 'newpass12', 'newpass12')).toBe(
      'Password must be at least 8 characters long'
    );
    expect(passwordChangeError('samepass1', 'samepass1', 'samepass1')).toBe(
      'New Password cannot be the same as Current Password'
    );
    expect(passwordChangeError('oldpass12', 'newpass12', 'newpass12')).toBeNull();
  });
});
