import { describe, expect, it } from '@jest/globals';
import type { RequestItem } from '@/src/features/admin/types/requests';
import type { DocumentMetadataItem } from '@/src/features/profile/types/userDocuments';
import {
  formatRequestDate,
  formatRequestValue,
  getFieldLabelFromType,
  pickIdCardDocuments,
  requesterSummary,
  summarizeBatchResolution,
  toEditRequestViews,
} from '@/src/features/admin/utils/editRequests';

const request = (id: string, request_type: RequestItem['request_type']): RequestItem =>
  ({
    id,
    request_type,
    old_value: 'old',
    new_value: null,
    created_at: '2026-01-05T10:00:00Z',
    resident_id: 'r1',
  }) as RequestItem;

describe('toEditRequestViews', () => {
  it('orders by request type and maps fields', () => {
    const views = toEditRequestViews([
      request('a', 'id_change'),
      request('b', 'phone_number_change'),
      request('c', 'email_change'),
      request('d', 'first_name_change'),
    ]);
    expect(views.map((v) => v.id)).toEqual(['d', 'c', 'b', 'a']);
    expect(views[0]).toEqual({
      id: 'd',
      requestType: 'first_name_change',
      oldValue: 'old',
      newValue: null,
      createdAt: '2026-01-05T10:00:00Z',
    });
  });
});

describe('formatting', () => {
  it('formats values', () => {
    expect(formatRequestValue(' Ada ', 'first_name_change')).toBe('Ada');
    expect(formatRequestValue(null, 'email_change')).toBe('Not provided');
    expect(formatRequestValue('x', 'id_change')).toBe('No preview...');
    expect(formatRequestValue('x', 'id_change', true)).toBe('No Preview...');
  });

  it('formats dates and ignores invalid ones', () => {
    expect(formatRequestDate('2026-01-05T10:00:00Z')).toBe('05 Jan 2026');
    expect(formatRequestDate('not a date')).toBe('');
  });

  it('labels fields and requesters', () => {
    expect(getFieldLabelFromType('id_change')).toBe('ID Card');
    expect(requesterSummary(null)).toEqual({ userName: 'Unknown User', userEmail: 'N/A' });
    expect(requesterSummary({ first_name: 'Ada', last_name: null, email: '' })).toEqual({
      userName: 'Ada',
      userEmail: 'N/A',
    });
  });
});

describe('summarizeBatchResolution', () => {
  it('reports full success', () => {
    const outcome = summarizeBatchResolution(
      ['a', 'b'],
      [
        { status: 'fulfilled', value: {} },
        { status: 'fulfilled', value: {} },
      ],
      'approve'
    );
    expect([...outcome.succeeded]).toEqual(['a', 'b']);
    expect(outcome.isError).toBe(false);
    expect(outcome.message).toBe('2 request(s) approved successfully!');
  });

  it('keeps failures and reports the first reason', () => {
    const outcome = summarizeBatchResolution(
      ['a', 'b', 'c'],
      [
        { status: 'rejected', reason: new Error(' Not allowed ') },
        { status: 'fulfilled', value: {} },
        { status: 'rejected', reason: 'plain' },
      ],
      'decline'
    );
    expect([...outcome.succeeded]).toEqual(['b']);
    expect(outcome.failed).toBe(2);
    expect(outcome.isError).toBe(true);
    expect(outcome.message).toBe('1 request(s) declined, 2 could not be declined. Not allowed');
  });
});

describe('pickIdCardDocuments', () => {
  it('finds the active and the pending ID card (pending needs an id)', () => {
    const docs = [
      { document_type: 'profile_picture', document_status: 'active' },
      { document_type: 'id_card', document_status: 'pending', document_id: null },
      { document_type: 'id_card', document_status: 'active', document_id: 'a' },
      { document_type: 'id_card', document_status: 'pending', document_id: 'p' },
    ] as DocumentMetadataItem[];
    const { active, pending } = pickIdCardDocuments(docs);
    expect(active?.document_id).toBe('a');
    expect(pending?.document_id).toBe('p');
  });
});
