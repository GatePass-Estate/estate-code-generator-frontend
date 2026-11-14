import type { Href } from 'expo-router';
import type { UserRolesType } from '@/src/shared/types/general';

/**
 * Post-auth home for a role. Matches `routeForUser` in auth screens: admins and residents
 * land on `/user` (admins open Admin Tools from there); security lands on `/security`.
 */
export function homeRouteForRole(role: UserRolesType | undefined | null): Href {
  if (role === 'security') return '/security';
  if (role === 'root' || role === 'primary_admin' || role === 'admin' || role === 'resident') {
    return '/user';
  }
  return '/auth';
}

export const ADMIN_ROLES = ['root', 'primary_admin', 'admin'] as const;
/** `/user` stack is shared by residents and admins (and root). */
export const USER_HOME_ROLES = ['root', 'primary_admin', 'admin', 'resident'] as const;
export const SECURITY_ROLES = ['security'] as const;
