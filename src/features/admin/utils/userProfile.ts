import type { User } from '@/src/features/users/types/user';
import type { UserRolesType } from '@/src/shared/types/general';
import { canChangeAdminRole } from '@/src/features/admin/utils/roleChange';

export type ProfileAction = 'deactivate' | 'promote' | 'demote' | 'transferPrimary';

export const emptyUser = (id: string): User => ({
  first_name: '',
  last_name: '',
  home_address: '',
  estate_name: '',
  email: '',
  phone_number: '',
  user_id: id,
  estate_id: '',
  role: 'resident',
  gender: null,
  status: false,
});

/** What the admin user profile shows and allows, from the viewed user and the viewer. */
export function getProfilePermissions({
  user,
  routeUserId,
  viewerRole,
  viewerUserId,
}: {
  user: User;
  routeUserId: string;
  viewerRole: UserRolesType | undefined;
  viewerUserId: string | null | undefined;
}) {
  const isVerifiedProfile = Boolean(
    user.status &&
    (user.role === 'resident' ||
      user.role === 'security' ||
      user.role === 'admin' ||
      user.role === 'primary_admin')
  );
  const isAdminProfile = Boolean(user.status && user.role === 'admin');
  const isOwnProfile = Boolean(
    viewerUserId &&
    (viewerUserId === user.user_id || viewerUserId === user.id || viewerUserId === routeUserId)
  );
  return {
    isVerifiedProfile,
    isAdminProfile,
    isOwnProfile,
    showRoleAction: canChangeAdminRole(viewerRole, user.role),
    canTransferPrimary: isAdminProfile && viewerRole === 'primary_admin' && !isOwnProfile,
    hideProfileActions:
      (isOwnProfile && (viewerRole === 'primary_admin' || viewerRole === 'admin')) ||
      (user.role === 'primary_admin' && viewerRole === 'admin'),
    verifiedRoleLabel:
      user.role === 'security'
        ? 'Security'
        : user.role === 'admin' || user.role === 'primary_admin'
          ? 'Admin'
          : 'Resident',
  };
}

export function profileActionCopy(action: ProfileAction | null): {
  title: string;
  message: string;
  button: string;
} {
  switch (action) {
    case 'deactivate':
      return {
        title: 'Deactivate User?',
        message: 'This user will lose access until their account is reactivated.',
        button: 'Deactivate',
      };
    case 'promote':
      return {
        title: 'Make Admin?',
        message: 'This user will receive secondary admin access.',
        button: 'Make Admin',
      };
    case 'transferPrimary':
      return {
        title: 'Promote',
        message:
          'Promoting this user will revoke your primary admin rights and sign you out. Are you sure you want to proceed?',
        button: 'Promote User',
      };
    default:
      return {
        title: 'Make Resident?',
        message: 'This admin will become a resident and lose admin access.',
        button: 'Make Resident',
      };
  }
}

/** The list row cached on tap, shaped as a profile (the profile API 404s inactive users). */
export function userFromListRow(row: User, userId: string): User {
  return { ...emptyUser(userId), ...row, user_id: row.user_id || userId, id: row.id || userId };
}
