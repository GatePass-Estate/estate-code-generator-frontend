import { describe, expect, it } from '@jest/globals';
import { getVerificationStep } from '@/src/lib/verificationStep';

describe('KYC verification step', () => {
  it('starts at the photo upload when no photo is uploaded yet', () => {
    expect(getVerificationStep(false, false)).toBe('photo');
  });

  it('moves to Verify your ID once the photo is uploaded', () => {
    expect(getVerificationStep(true, false)).toBe('id');
  });

  it('waits for approval once the photo and ID are uploaded', () => {
    expect(getVerificationStep(true, true)).toBe('pending');
  });

  it('never skips the photo, even when an ID is already uploaded', () => {
    expect(getVerificationStep(false, true)).toBe('photo');
  });
});
