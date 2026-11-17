import type { Codes } from '@/src/features/access-codes/types/codes';
import type { GuestDetails } from '@/src/features/visitors/types/index';

export const ACCESS_CODE_LENGTH = 6;
export const EMPTY_CODE: readonly string[] = ['', '', '', '', '', ''];

export const INCOMPLETE_CODE_MESSAGE = 'Please fill all 6 digits';
export const REJECTED_CODE_MESSAGE = 'This code does not exist or has expired.';

/** Letters and digits only, upper-cased (what a code box accepts). */
export const cleanCodeInput = (value: string) => value.replace(/[^0-9a-zA-Z]/g, '').toUpperCase();

/**
 * A 200 from the code service can still carry a frozen or expired code; web and native treat
 * both as "does not exist or has expired".
 */
export const isRejectedValidation = (result: Pick<Codes, 'is_valid' | 'is_expired'>) =>
  result.is_valid === false || Boolean(result.is_expired);

export const normalizeAccessCode = (value: string | null | undefined) => {
  const candidate = value?.replace(/[^0-9a-zA-Z]/g, '').toUpperCase();
  return candidate && /^[0-9A-Z]{6}$/.test(candidate) ? candidate : '';
};

/** Pulls a 6-character access code out of a QR payload (JSON, URL, labelled or plain text). */
export const extractScannedAccessCode = (value: string) => {
  const rawValue = value.trim();
  const codeKeys = ['code', 'access_code', 'accessCode'];

  try {
    const parsed = JSON.parse(rawValue);

    if (parsed && typeof parsed === 'object') {
      for (const key of codeKeys) {
        const candidate = normalizeAccessCode(String(parsed[key] ?? ''));
        if (candidate) return candidate;
      }
    }
  } catch {
    // QR payloads are often plain text or URLs rather than JSON.
  }

  try {
    const url = new URL(rawValue);

    for (const key of codeKeys) {
      const candidate = normalizeAccessCode(url.searchParams.get(key));
      if (candidate) return candidate;
    }

    const pathCandidate = url.pathname
      .split('/')
      .reverse()
      .map((part) => normalizeAccessCode(part))
      .find(Boolean);

    if (pathCandidate) return pathCandidate;
  } catch {
    // The scanner usually receives the raw access code, not a URL.
  }

  const groupedCandidate = rawValue
    .toUpperCase()
    .split(/[^0-9A-Z]+/)
    .filter(Boolean)
    .find((part) => /^[0-9A-Z]{6}$/.test(part));

  if (groupedCandidate) return groupedCandidate;

  const labelledCandidate = rawValue
    .toUpperCase()
    .match(/(?:CODE|ACCESS_CODE|ACCESSCODE|ACCESS)[^0-9A-Z]*([0-9A-Z][0-9A-Z\s-]{4,10}[0-9A-Z])/);

  const normalizedLabelledCandidate = normalizeAccessCode(labelledCandidate?.[1]);
  if (normalizedLabelledCandidate) return normalizedLabelledCandidate;

  const visibleCandidate = rawValue
    .toUpperCase()
    .match(/(^|[^0-9A-Z])([0-9A-Z]{3}[\s-]?[0-9A-Z]{3})(?=$|[^0-9A-Z])/);

  const normalizedVisibleCandidate = normalizeAccessCode(visibleCandidate?.[2]);
  if (normalizedVisibleCandidate) return normalizedVisibleCandidate;

  return normalizeAccessCode(rawValue);
};

/** Invite details shown right after validation (web); resident fields are filled in later. */
export function guestDetailsFromValidation(
  result: Pick<
    Codes,
    'visitor_fullname' | 'relationship_with_resident' | 'gender' | 'hashed_code' | 'receiver'
  >
): GuestDetails {
  return {
    visitor_fullname: result.visitor_fullname ?? '',
    relationship_with_resident: result.relationship_with_resident,
    gender: result.gender,
    resident_name: '',
    resident_address: '',
    resident_email: '',
    resident_phone_number: '',
    code: result.hashed_code,
    isResident: result.receiver === 'resident',
  };
}

type ResidentContact = {
  first_name?: string | null;
  last_name?: string | null;
  home_address?: string | null;
  email?: string | null;
  phone_number?: string | null;
};

export function withResidentDetails(base: GuestDetails, resident: ResidentContact): GuestDetails {
  return {
    ...base,
    resident_name: `${resident.first_name ?? ''} ${resident.last_name ?? ''}`.trim(),
    resident_address: resident.home_address ?? '',
    resident_email: resident.email ?? '',
    resident_phone_number: resident.phone_number ?? '',
  };
}

/** Client-side checks before a password change; returns the message to show, or null. */
export function passwordChangeError(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): string | null {
  if (newPassword !== confirmPassword) return 'New Password and Confirm Password do not match';
  if (newPassword.length < 8 || currentPassword.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  if (newPassword === currentPassword) return 'New Password cannot be the same as Current Password';
  return null;
}
