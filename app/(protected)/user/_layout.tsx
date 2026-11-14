import { usePathname } from 'expo-router';
import NavigationContainer from '@/src/features/dashboard/components/NavigationContainer';
import { menuRoutes } from '@/src/features/dashboard/components/menuRoutes';
import { sharedStyles } from '@/src/shared/theme/styles';
import RoleGuard from '@/src/features/auth/components/RoleGuard';
import { USER_HOME_ROLES } from '@/src/features/auth/utils/roleRoutes';
import type { UserRolesType } from '@/src/shared/types/general';

/** Incident report lives under `/user/report`; security opens it from their own tab bar. */
const REPORT_ROLES = [
  ...USER_HOME_ROLES,
  'security',
] as const satisfies readonly NonNullable<UserRolesType>[];

function isUserReportPath(pathname: string) {
  const path = pathname.replace(/\/+$/, '') || '/';
  return path === '/user/report' || path.startsWith('/user/report/');
}

export default function UserRootLayout() {
  const pathname = usePathname();
  const allow = isUserReportPath(pathname) ? REPORT_ROLES : USER_HOME_ROLES;

  return (
    <RoleGuard allow={allow}>
      <NavigationContainer routes={menuRoutes} tabBarStyle={sharedStyles.tabBar} />
    </RoleGuard>
  );
}
