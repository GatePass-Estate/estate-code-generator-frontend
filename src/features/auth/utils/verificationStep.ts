/**
 * Where an unverified user is in the KYC flow: upload a photo (1/2), then the ID (2/2), then wait
 * for an admin to approve it. The photo always comes first, so nobody can skip it.
 */
export type VerificationStep = 'photo' | 'id' | 'pending';

export function getVerificationStep(
  hasPhoto: boolean,
  hasIdentification: boolean
): VerificationStep {
  if (!hasPhoto) return 'photo';
  if (!hasIdentification) return 'id';
  return 'pending';
}
