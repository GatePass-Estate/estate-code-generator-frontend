export const SEAT_REDUCTION_BLOCKED_TITLE = 'Registration Blocked';
export const SEAT_REDUCTION_BLOCKED_MESSAGE =
  'A seat reduction request prevents addition of new users. To add users, the request has to be cancelled.';

/** True when a scheduled seat reduction should block registering new users. */
export function isSeatReductionPending({
  capacity,
  pendingCoveredUsers,
  reason,
}: {
  capacity: number | null | undefined;
  pendingCoveredUsers: number | null | undefined;
  reason?: string | null;
}): boolean {
  const normalizedReason = reason?.toLowerCase() ?? '';
  return (
    (pendingCoveredUsers != null && capacity != null && pendingCoveredUsers < capacity) ||
    normalizedReason.includes('seat') ||
    normalizedReason.includes('reduction')
  );
}
