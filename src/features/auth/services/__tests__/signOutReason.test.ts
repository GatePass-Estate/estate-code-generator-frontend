import { describe, expect, it } from '@jest/globals';
import {
  errorDetail,
  parseSignOutReason,
  signOutNotice,
  signOutReasonFromRefreshFailure,
  signOutReasonFromRequestFailure,
} from '@/src/features/auth/services/signOutReason';

const NOW = 1_800_000_000_000;

describe('signOutReasonFromRefreshFailure', () => {
  it('treats an expired refresh token as inactivity', () => {
    expect(signOutReasonFromRefreshFailure('Refresh token has expired.', null, NOW)).toBe(
      'inactive'
    );
    // Even if the server words it differently, the token's own expiry says so.
    expect(signOutReasonFromRefreshFailure('', NOW - 1, NOW)).toBe('inactive');
  });

  it('separates a lapsed session from one that was ended', () => {
    expect(signOutReasonFromRefreshFailure('Session has expired.', NOW + 60_000, NOW)).toBe(
      'expired'
    );
    expect(
      signOutReasonFromRefreshFailure('Session is invalid or expired.', NOW + 60_000, NOW)
    ).toBe('ended');
    expect(
      signOutReasonFromRefreshFailure(
        'Refresh token reuse detected. Session revoked for security.',
        NOW + 60_000,
        NOW
      )
    ).toBe('ended');
  });
});

describe('signOutReasonFromRequestFailure', () => {
  it('maps the API 401 details', () => {
    expect(signOutReasonFromRequestFailure('Session has expired.')).toBe('expired');
    expect(signOutReasonFromRequestFailure('Token has expired')).toBe('expired');
    expect(signOutReasonFromRequestFailure('Session has been revoked.')).toBe('ended');
    expect(signOutReasonFromRequestFailure('')).toBe('ended');
  });
});

describe('signOutNotice', () => {
  it('never blames another device', () => {
    for (const reason of ['inactive', 'expired', 'ended'] as const) {
      expect(signOutNotice(reason)).not.toMatch(/another device/i);
    }
    expect(signOutNotice('inactive')).toMatch(/inactivity/);
  });
});

describe('parseSignOutReason / errorDetail', () => {
  it('accepts only known reasons', () => {
    expect(parseSignOutReason('inactive')).toBe('inactive');
    expect(parseSignOutReason(['ended'])).toBe('ended');
    expect(parseSignOutReason('true')).toBeNull();
    expect(parseSignOutReason(undefined)).toBeNull();
  });

  it('reads a FastAPI detail string', () => {
    expect(errorDetail({ detail: 'Session has expired.' })).toBe('Session has expired.');
    expect(errorDetail({ detail: [{ msg: 'x' }] })).toBe('');
    expect(errorDetail(undefined)).toBe('');
  });
});
