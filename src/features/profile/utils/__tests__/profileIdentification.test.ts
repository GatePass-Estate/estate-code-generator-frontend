import type { PendingRequestSheetData } from '@/src/features/admin/types/pendingRequest';
import {
  identificationDisplayValue,
  identificationPreview,
  profileLockState,
} from '@/src/features/profile/utils/profileIdentification';

// The real helper reaches AsyncStorage through the auth helpers; only the MIME lookup is needed.
jest.mock('@/src/features/profile/utils/userDocumentHelpers', () => ({
  getMimeTypeFromUri: () => 'image/jpeg',
}));

const pending = (overrides: Partial<PendingRequestSheetData> = {}) =>
  ({ kind: 'identification', requestId: 'r1', ...overrides }) as PendingRequestSheetData;

describe('identificationDisplayValue', () => {
  it('prefers the pending upload name', () => {
    expect(identificationDisplayValue(pending({ newFileName: 'id.jpg' }), 'file://a')).toBe(
      'id.jpg'
    );
    expect(identificationDisplayValue(pending({ newFileName: '' }), null)).toBe('Uploaded');
  });

  it('falls back to the active ID or the hint', () => {
    expect(identificationDisplayValue(null, 'file://a')).toBe('No Preview');
    expect(identificationDisplayValue(null, null)).toBe('Passport or ID card only');
  });
});

describe('identificationPreview', () => {
  it('shows the pending file with its content type', () => {
    expect(
      identificationPreview(
        pending({ newFileUri: 'file://new.pdf' }),
        'file://a',
        'image/png',
        'application/pdf'
      )
    ).toEqual({ uri: 'file://new.pdf', contentType: 'application/pdf' });
    expect(
      identificationPreview(pending({ newFileUri: 'file://new.jpg' }), null, null, null)
    ).toEqual({ uri: 'file://new.jpg', contentType: 'image/jpeg' });
  });

  it('shows the active ID otherwise', () => {
    expect(identificationPreview(null, 'file://a', 'image/png', null)).toEqual({
      uri: 'file://a',
      contentType: 'image/png',
    });
    expect(identificationPreview(null, null, null, null)).toEqual({ uri: null, contentType: null });
  });
});

describe('profileLockState', () => {
  const base = { uploading: false, verificationBlocked: true, idPending: true };

  it('locks while an onboarding step is missing', () => {
    expect(profileLockState({ ...base, onboardingStep: 'photo' })).toEqual({
      isProfileLocked: true,
      isAwaitingApproval: false,
    });
  });

  it('unlocks while uploading', () => {
    expect(profileLockState({ ...base, onboardingStep: 'id', uploading: true })).toEqual({
      isProfileLocked: false,
      isAwaitingApproval: false,
    });
  });

  it('awaits approval once uploads are in and the ID is pending', () => {
    expect(profileLockState({ ...base, onboardingStep: null })).toEqual({
      isProfileLocked: false,
      isAwaitingApproval: true,
    });
    expect(
      profileLockState({ ...base, onboardingStep: null, verificationBlocked: false })
        .isAwaitingApproval
    ).toBe(false);
  });
});
