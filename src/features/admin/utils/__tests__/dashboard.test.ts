import { describe, expect, it } from '@jest/globals';
import { getRegistrationBlockReason } from '@/src/features/admin/utils/dashboard';

describe('getRegistrationBlockReason', () => {
  it('allows registration below capacity with no pending reduction', () => {
    expect(
      getRegistrationBlockReason({ occupiedSeats: 5, capacity: 10, pendingCoveredUsers: null })
    ).toBeNull();
    expect(
      getRegistrationBlockReason({ occupiedSeats: 5, capacity: null, pendingCoveredUsers: 2 })
    ).toBeNull();
  });

  it('blocks at or over capacity first', () => {
    expect(
      getRegistrationBlockReason({ occupiedSeats: 10, capacity: 10, pendingCoveredUsers: 4 })
    ).toBe('capacity');
  });

  it('blocks when a pending reduction is at or below the registered users', () => {
    expect(
      getRegistrationBlockReason({ occupiedSeats: 6, capacity: 10, pendingCoveredUsers: 6 })
    ).toBe('pending_reduction');
    expect(
      getRegistrationBlockReason({ occupiedSeats: 6, capacity: 10, pendingCoveredUsers: 8 })
    ).toBeNull();
  });
});
