import { describe, expect, it } from '@jest/globals';
import type { User } from '@/src/features/users/types/user';
import {
  emptyUser,
  getProfilePermissions,
  profileActionCopy,
  userFromListRow,
} from '@/src/features/admin/utils/userProfile';

const verified = (overrides: Partial<User>): User => ({
  ...emptyUser('u1'),
  status: true,
  ...overrides,
});

describe('getProfilePermissions', () => {
  it('lets the primary admin transfer primary to another admin', () => {
    const p = getProfilePermissions({
      user: verified({ role: 'admin' }),
      routeUserId: 'u1',
      viewerRole: 'primary_admin',
      viewerUserId: 'me',
    });
    expect(p).toMatchObject({
      isVerifiedProfile: true,
      isAdminProfile: true,
      isOwnProfile: false,
      showRoleAction: true,
      canTransferPrimary: true,
      hideProfileActions: false,
      verifiedRoleLabel: 'Admin',
    });
  });

  it('hides actions on your own profile and on the primary admin for admins', () => {
    expect(
      getProfilePermissions({
        user: verified({ role: 'admin' }),
        routeUserId: 'me',
        viewerRole: 'admin',
        viewerUserId: 'me',
      }).hideProfileActions
    ).toBe(true);
    expect(
      getProfilePermissions({
        user: verified({ role: 'primary_admin' }),
        routeUserId: 'u1',
        viewerRole: 'admin',
        viewerUserId: 'me',
      })
    ).toMatchObject({ hideProfileActions: true, showRoleAction: false });
  });

  it('treats inactive users as unverified', () => {
    const p = getProfilePermissions({
      user: emptyUser('u1'),
      routeUserId: 'u1',
      viewerRole: 'primary_admin',
      viewerUserId: 'me',
    });
    expect(p.isVerifiedProfile).toBe(false);
    expect(p.verifiedRoleLabel).toBe('Resident');
  });
});

describe('profile helpers', () => {
  it('words each confirmation', () => {
    expect(profileActionCopy('deactivate').button).toBe('Deactivate');
    expect(profileActionCopy('transferPrimary').title).toBe('Promote');
    expect(profileActionCopy('demote').button).toBe('Make Resident');
  });

  it('shapes a cached list row as a profile', () => {
    const row = { first_name: 'Ada', role: 'security', user_id: '' } as User;
    expect(userFromListRow(row, 'u9')).toMatchObject({
      first_name: 'Ada',
      role: 'security',
      user_id: 'u9',
      id: 'u9',
      email: '',
    });
  });
});
