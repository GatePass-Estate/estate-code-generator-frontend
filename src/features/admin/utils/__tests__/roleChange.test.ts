import { describe, expect, it } from '@jest/globals';
import { canChangeAdminRole, hasApprovedIdDocument } from '@/src/features/admin/utils/roleChange';

describe('canChangeAdminRole', () => {
  it('lets only the primary admin promote residents or demote admins', () => {
    expect(canChangeAdminRole('primary_admin', 'resident')).toBe(true);
    expect(canChangeAdminRole('primary_admin', 'admin')).toBe(true);
  });

  it('refuses other viewers', () => {
    expect(canChangeAdminRole('admin', 'resident')).toBe(false);
    expect(canChangeAdminRole('admin', 'admin')).toBe(false);
    expect(canChangeAdminRole('resident', 'resident')).toBe(false);
    expect(canChangeAdminRole(null, 'resident')).toBe(false);
    expect(canChangeAdminRole(undefined, 'admin')).toBe(false);
  });

  it('refuses targets that are not a resident or admin', () => {
    expect(canChangeAdminRole('primary_admin', 'primary_admin')).toBe(false);
    expect(canChangeAdminRole('primary_admin', 'security')).toBe(false);
    expect(canChangeAdminRole('primary_admin', null)).toBe(false);
  });
});

describe('hasApprovedIdDocument', () => {
  it('needs an active id card', () => {
    expect(
      hasApprovedIdDocument([
        { document_type: 'id_card', content_type: 'image/png', document_status: 'active' },
      ])
    ).toBe(true);
  });

  it('ignores pending ids and other document types', () => {
    expect(hasApprovedIdDocument([])).toBe(false);
    expect(
      hasApprovedIdDocument([
        { document_type: 'id_card', content_type: 'image/png', document_status: 'pending' },
        { document_type: 'profile_picture', content_type: 'image/png', document_status: 'active' },
        { document_type: 'id_card', content_type: 'image/png', document_status: null },
      ])
    ).toBe(false);
  });
});
