import { describe, expect, it } from '@jest/globals';
import { isPendingIdRejected } from '@/src/lib/idRejection';
import type { RequestItem, RequestStatus } from '@/src/types/requests';

function idRequest(newValue: string, status: RequestStatus, requestType = 'id_change') {
  return {
    id: `req-${newValue}`,
    resident_id: 'u1',
    estate_id: 'e1',
    request_type: requestType,
    old_value: '',
    new_value: newValue,
    status,
    created_at: '2026-10-19T12:00:00Z',
  } as RequestItem;
}

describe('isPendingIdRejected', () => {
  it('is rejected when the request for the pending ID was rejected', () => {
    expect(isPendingIdRejected([idRequest('doc-1', 'rejected')], 'doc-1')).toBe(true);
  });

  it('is not rejected while that request is still pending', () => {
    expect(isPendingIdRejected([idRequest('doc-1', 'pending')], 'doc-1')).toBe(false);
  });

  it('ignores a rejection of an older ID once a new one is uploaded', () => {
    expect(
      isPendingIdRejected([idRequest('doc-2', 'pending'), idRequest('doc-1', 'rejected')], 'doc-2')
    ).toBe(false);
  });

  it('ignores other profile edits', () => {
    expect(isPendingIdRejected([idRequest('doc-1', 'rejected', 'phone_number')], 'doc-1')).toBe(
      false
    );
  });
});
