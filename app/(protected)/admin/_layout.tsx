import { sharedStyles } from '@/src/shared/theme/styles';
import NavigationContainer from '@/src/features/dashboard/components/NavigationContainer';
import { adminRoutes } from '@/src/features/dashboard/components/menuRoutes';
import RoleGuard from '@/src/features/auth/components/RoleGuard';
import { ADMIN_ROLES } from '@/src/features/auth/utils/roleRoutes';

export default function AdminScreenLayout() {
  return (
    <RoleGuard allow={ADMIN_ROLES}>
      <NavigationContainer
        routes={adminRoutes}
        tabBarStyle={sharedStyles.tabBar}
        enableForMobile={false}
      />
    </RoleGuard>
  );
}
