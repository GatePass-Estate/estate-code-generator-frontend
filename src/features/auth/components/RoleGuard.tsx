import type { ReactNode } from 'react';
import { Redirect } from 'expo-router';
import { useUserStore } from '@/src/store/userStore';
import type { UserRolesType } from '@/src/shared/types/general';
import { homeRouteForRole } from '@/src/features/auth/utils/roleRoutes';

type Props = {
  /** Roles allowed to stay on this branch of the protected tree. */
  allow: readonly NonNullable<UserRolesType>[];
  children: ReactNode;
};

/**
 * Layout-level role gate. Session auth is handled by `(protected)/_layout`; this stops a
 * signed-in user deep-linking into another role's screens (web URL or forged path).
 */
export default function RoleGuard({ allow, children }: Props) {
  const role = useUserStore((state) => state.role);

  if (!role || !allow.includes(role)) {
    return <Redirect href={homeRouteForRole(role)} />;
  }

  return <>{children}</>;
}
