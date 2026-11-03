import type { RequestItem } from '@/src/types/requests';

/**
 * Whether the admin rejected the ID that is still pending. A rejected ID stays `pending` in the
 * user's documents, so the answer comes from the user's own ID change request for that document
 * (`GET /requests/edit/me`), whose `new_value` is the document id.
 */
export function isPendingIdRejected(requests: RequestItem[], pendingDocumentId: string): boolean {
  const request = requests.find(
    (r) => r.request_type === 'id_change' && r.new_value === pendingDocumentId
  );
  return request?.status === 'rejected';
}
