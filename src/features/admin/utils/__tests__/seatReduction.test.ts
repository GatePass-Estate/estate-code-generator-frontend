import { describe, expect, it } from '@jest/globals';
import { isSeatReductionPending } from '@/src/features/admin/utils/seatReduction';

describe('isSeatReductionPending', () => {
  it('is true when the pending seat count is below the current capacity', () => {
    expect(isSeatReductionPending({ capacity: 40, pendingCoveredUsers: 30 })).toBe(true);
  });

  it('is false without a reduction', () => {
    expect(isSeatReductionPending({ capacity: 40, pendingCoveredUsers: 40 })).toBe(false);
    expect(isSeatReductionPending({ capacity: 40, pendingCoveredUsers: 50 })).toBe(false);
    expect(isSeatReductionPending({ capacity: null, pendingCoveredUsers: 10 })).toBe(false);
    expect(isSeatReductionPending({ capacity: 40, pendingCoveredUsers: null })).toBe(false);
    expect(isSeatReductionPending({ capacity: 0, pendingCoveredUsers: 0, reason: null })).toBe(
      false
    );
  });

  it('treats a 0-seat pending reduction as pending', () => {
    expect(isSeatReductionPending({ capacity: 5, pendingCoveredUsers: 0 })).toBe(true);
  });

  it('is true when the entitlements reason mentions seats or a reduction', () => {
    expect(
      isSeatReductionPending({ capacity: null, pendingCoveredUsers: null, reason: 'Seat limit' })
    ).toBe(true);
    expect(
      isSeatReductionPending({ capacity: null, pendingCoveredUsers: null, reason: 'REDUCTION' })
    ).toBe(true);
  });
});
