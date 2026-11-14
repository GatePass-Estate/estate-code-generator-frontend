import NavigationContainer from '@/src/features/dashboard/components/NavigationContainer';
import { menuRoutes } from '@/src/features/dashboard/components/menuRoutes';
import { sharedStyles } from '@/src/shared/theme/styles';
import RoleGuard from '@/src/features/auth/components/RoleGuard';
import { USER_HOME_ROLES } from '@/src/features/auth/utils/roleRoutes';

export default function UserRootLayout() {
  return (
    <RoleGuard allow={USER_HOME_ROLES}>
      <NavigationContainer routes={menuRoutes} tabBarStyle={sharedStyles.tabBar} />
    </RoleGuard>
  );
}
