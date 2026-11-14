import type { UserRolesType } from '@/src/shared/types/general';
import type { DocumentMetadataItem } from '@/src/features/profile/types/userDocuments';

export const PROMOTE_REQUIRES_APPROVED_ID_MESSAGE =
  'User must have an approved ID before they can be made an admin.';

/** Only the primary admin can make a resident an admin, or an admin a resident. */
export function canChangeAdminRole(
  viewerRole: UserRolesType | undefined,
  targetRole: UserRolesType | undefined
): boolean {
  return viewerRole === 'primary_admin' && (targetRole === 'resident' || targetRole === 'admin');
}

/** A user can be promoted to admin only once their ID card has been approved. */
export function hasApprovedIdDocument(documents: readonly DocumentMetadataItem[]): boolean {
  return documents.some(
    (document) => document.document_type === 'id_card' && document.document_status === 'active'
  );
}
