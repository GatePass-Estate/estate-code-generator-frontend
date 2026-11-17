import type { AllUsers, User } from '@/src/features/users/types/user';

/** Role filter on the desktop Admin Access table (`null` = all verified users). */
export type AdminTableRoleFilter = 'resident' | 'security' | 'admins' | 'unverified' | null;

export type AdminUserAction =
  | 'promote'
  | 'demote'
  | 'deactivate'
  | 'reactivate'
  | 'resendVerification'
  | 'deleteUser';

/** Maps the role `<select>` value onto a filter; anything unknown means "All Verified". */
export function parseAdminTableRoleFilter(value: string): AdminTableRoleFilter {
  return value === 'resident' ||
    value === 'security' ||
    value === 'admins' ||
    value === 'unverified'
    ? value
    : null;
}

/** Search (name, email, phone, address) + role filter, as the desktop table applies them. */
export function filterAdminTableUsers(
  users: readonly User[],
  search: string,
  role: AdminTableRoleFilter
): User[] {
  const query = search.trim().toLowerCase();
  return users.filter((user) => {
    const matchesSearch =
      !query ||
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.phone_number?.toLowerCase().includes(query) ||
      user.home_address?.toLowerCase().includes(query);

    let matchesRole = false;
    if (role === 'admins') {
      matchesRole = Boolean(
        user.status && user.role && ['admin', 'primary_admin'].includes(user.role as string)
      );
    } else if (role === 'unverified') {
      matchesRole = !user.status;
    } else {
      matchesRole = !role ? Boolean(user.status) : Boolean(user.status && user.role === role);
    }

    return Boolean(matchesSearch) && matchesRole;
  });
}

export function totalTablePages(total: number, pageSize: number): number {
  return total > 0 ? Math.ceil(total / pageSize) : 1;
}

/** Resident / security counts: the server's role summary, else the loaded rows. */
export function tableRoleCounts(users: Pick<AllUsers, 'items' | 'role_summary'>) {
  return {
    residents:
      users.role_summary?.resident ?? users.items.filter((user) => user.role === 'resident').length,
    security:
      users.role_summary?.security ?? users.items.filter((user) => user.role === 'security').length,
  };
}

export function adminActionHeading(action: AdminUserAction | null, isError: boolean): string {
  if (isError) return 'Error';
  switch (action) {
    case 'promote':
      return 'Promote User';
    case 'demote':
      return 'Demote Admin';
    case 'deactivate':
      return 'Deactivate User';
    case 'reactivate':
      return 'Reactivate User';
    case 'resendVerification':
      return 'Resend Verification Email';
    case 'deleteUser':
      return 'Delete User';
    default:
      return 'Confirmation';
  }
}

export function adminActionButtonLabel(action: AdminUserAction | null): string | undefined {
  switch (action) {
    case 'promote':
      return 'Promote';
    case 'demote':
      return 'Demote';
    case 'deactivate':
      return 'Deactivate';
    case 'reactivate':
      return 'Reactivate';
    case 'resendVerification':
      return 'Resend';
    case 'deleteUser':
      return 'Delete';
    default:
      return undefined;
  }
}

/** Promote / reactivate / resend use the primary button; the rest are destructive (red). */
export function isPositiveAdminAction(action: AdminUserAction | null): boolean {
  return action === 'promote' || action === 'reactivate' || action === 'resendVerification';
}

export function adminActionSuccessMessage(action: AdminUserAction, userName: string): string {
  switch (action) {
    case 'promote':
      return `${userName} has been successfully promoted to Admin.`;
    case 'demote':
      return `${userName} has been successfully demoted to Resident.`;
    case 'deactivate':
      return 'User has been successfully deactivated.';
    case 'reactivate':
      return 'User has been successfully reactivated.';
    case 'resendVerification':
      return `Verification email has been resent to ${userName}.`;
    case 'deleteUser':
      return `${userName} has been successfully deleted.`;
  }
}
