export type RegistrationBlockReason = 'capacity' | 'pending_reduction';

/**
 * Why the admin home's Register User tile is blocked, or `null` when registration is allowed.
 * Order: capacity first, then a scheduled seat reduction at or below the registered users.
 */
export function getRegistrationBlockReason({
  occupiedSeats,
  capacity,
  pendingCoveredUsers,
}: {
  occupiedSeats: number;
  capacity: number | null;
  pendingCoveredUsers: number | null;
}): RegistrationBlockReason | null {
  if (capacity !== null && occupiedSeats >= capacity) return 'capacity';
  const hasPendingSeatReduction =
    pendingCoveredUsers !== null && capacity !== null && pendingCoveredUsers < capacity;
  if (hasPendingSeatReduction && pendingCoveredUsers <= occupiedSeats) return 'pending_reduction';
  return null;
}
