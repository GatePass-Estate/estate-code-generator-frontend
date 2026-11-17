import type { PendingRequestSheetData } from '@/src/features/admin/types/pendingRequest';
import type { ProfileOnboardingStep } from '@/src/features/profile/components/ProfileOnboardingBanner';
import { getMimeTypeFromUri } from '@/src/features/profile/utils/userDocumentHelpers';

/** Value shown on the Identification row. */
export function identificationDisplayValue(
  pendingRequest: PendingRequestSheetData | null,
  identificationUri: string | null
) {
  if (pendingRequest) return pendingRequest.newFileName || 'Uploaded';
  return identificationUri ? 'No Preview' : 'Passport or ID card only';
}

/** The file the preview modal shows: the pending upload first, else the active ID. */
export function identificationPreview(
  pendingRequest: PendingRequestSheetData | null,
  identificationUri: string | null,
  identificationContentType: string | null,
  pendingContentType: string | null
): { uri: string | null; contentType: string | null } {
  const uri = pendingRequest?.newFileUri ?? identificationUri ?? null;
  const contentType = pendingRequest?.newFileUri
    ? (pendingContentType ?? getMimeTypeFromUri(pendingRequest.newFileUri, 'id_card'))
    : identificationContentType;
  return { uri, contentType };
}

/**
 * Profile gating. Locked while a photo or ID is missing (unless one is uploading); "awaiting
 * approval" once both are in and the ID waits for an admin.
 */
export function profileLockState({
  onboardingStep,
  uploading,
  verificationBlocked,
  idPending,
}: {
  onboardingStep: ProfileOnboardingStep;
  uploading: boolean;
  verificationBlocked: boolean;
  idPending: boolean;
}) {
  const isProfileLocked = onboardingStep !== null && !uploading;
  const isAwaitingApproval = !isProfileLocked && verificationBlocked && idPending && !uploading;
  return { isProfileLocked, isAwaitingApproval };
}
