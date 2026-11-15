import type { DocumentMetadataItem } from '@/src/features/profile/types/userDocuments';
import type {
  EditRequestView,
  RequestItem,
  RequestType,
  SearchRequestPayload,
} from '@/src/features/admin/types/requests';

/** Pending requests shown on the Edit Requests screen (web and mobile). */
export const PENDING_EDIT_REQUESTS: SearchRequestPayload = {
  page: 1,
  limit: 50,
  status: 'pending',
};

const REQUEST_ORDER: Partial<Record<RequestType, number>> = {
  first_name_change: 0,
  gender_change: 1,
  email_change: 2,
  last_name_change: 3,
  id_change: 5,
};

/** Mobile list rows, ordered by request type (unlisted types sit between last name and ID). */
export function toEditRequestViews(items: readonly RequestItem[]): EditRequestView[] {
  return items
    .map((item) => ({
      id: item.id,
      requestType: item.request_type,
      oldValue: item.old_value,
      newValue: item.new_value ?? null,
      createdAt: item.created_at,
    }))
    .sort(
      (first, second) =>
        (REQUEST_ORDER[first.requestType] ?? 4) - (REQUEST_ORDER[second.requestType] ?? 4)
    );
}

export const REQUEST_LABELS: Record<RequestType, string> = {
  first_name_change: 'First Name Edit',
  last_name_change: 'Last Name Edit',
  email_change: 'Email Address Edit',
  home_address_change: 'Address Edit',
  gender_change: 'Gender Edit',
  vacate_residence: 'Residence Edit',
  phone_number_change: 'Phone Number Edit',
  id_change: 'ID Edit',
};

export function formatRequestValue(
  value: string | null,
  type: RequestType,
  isNewValue = false
): string {
  if (type === 'id_change') return isNewValue ? 'No Preview...' : 'No preview...';
  return value?.trim() || 'Not provided';
}

export function formatRequestDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Field name used by the desktop table and its detail modal. */
export function getFieldLabelFromType(type: RequestType): string {
  const labels: Record<RequestType, string> = {
    first_name_change: 'First Name',
    last_name_change: 'Last Name',
    email_change: 'Email Address',
    home_address_change: 'Address',
    gender_change: 'Gender',
    vacate_residence: 'Vacate Residence',
    phone_number_change: 'Phone Number',
    id_change: 'ID Card',
  };
  return labels[type] || 'Unknown Field';
}

/** Requester name/email for the desktop table (`null` = lookup failed). */
export function requesterSummary(
  user: { first_name?: string | null; last_name?: string | null; email?: string | null } | null
): { userName: string; userEmail: string } {
  if (!user) return { userName: 'Unknown User', userEmail: 'N/A' };
  return {
    userName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown User',
    userEmail: user.email || 'N/A',
  };
}

/**
 * Outcome of approving/declining several requests at once. Each request settles on its own, so
 * the ones the server accepted leave the list even when others fail.
 */
export function summarizeBatchResolution(
  ids: readonly string[],
  results: readonly PromiseSettledResult<unknown>[],
  action: 'approve' | 'decline'
): { succeeded: Set<string>; failed: number; isError: boolean; message: string } {
  const done = action === 'approve' ? 'approved' : 'declined';
  const succeeded = new Set(ids.filter((_, i) => results[i]?.status === 'fulfilled'));
  const failed = results.length - succeeded.size;
  if (failed === 0) {
    return {
      succeeded,
      failed,
      isError: false,
      message: `${succeeded.size} request(s) ${done} successfully!`,
    };
  }
  const firstError = results.find((r) => r.status === 'rejected') as
    | PromiseRejectedResult
    | undefined;
  const reason = firstError?.reason instanceof Error ? ` ${firstError.reason.message.trim()}` : '';
  return {
    succeeded,
    failed,
    isError: true,
    message: `${succeeded.size} request(s) ${done}, ${failed} could not be ${done}.${reason}`,
  };
}

/** The active and pending ID cards among a user's documents (pending needs a document id). */
export function pickIdCardDocuments(documents: readonly DocumentMetadataItem[]): {
  active: DocumentMetadataItem | undefined;
  pending: DocumentMetadataItem | undefined;
} {
  return {
    active: documents.find(
      (document) => document.document_type === 'id_card' && document.document_status === 'active'
    ),
    pending: documents.find(
      (document) =>
        document.document_type === 'id_card' &&
        document.document_status === 'pending' &&
        document.document_id
    ),
  };
}
