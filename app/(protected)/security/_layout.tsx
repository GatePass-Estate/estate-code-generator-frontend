import NavigationContainer from '@/src/features/dashboard/components/NavigationContainer';
import { sharedStyles } from '@/src/shared/theme/styles';
import RoleGuard from '@/src/features/auth/components/RoleGuard';
import { SECURITY_ROLES } from '@/src/features/auth/utils/roleRoutes';

export default function RootLayout() {
  return (
    <RoleGuard allow={SECURITY_ROLES}>
      <NavigationContainer tabBarStyle={sharedStyles.tabBar} enableForMobile={false} />
    </RoleGuard>
  );
}
