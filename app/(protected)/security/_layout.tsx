import RoleShell from '@/src/features/dashboard/components/RoleShell';
import { sharedStyles } from '@/src/shared/theme/styles';
import RoleGuard from '@/src/features/auth/components/RoleGuard';
import { SECURITY_ROLES } from '@/src/features/auth/utils/roleRoutes';

export default function RootLayout() {
  return (
    <RoleGuard allow={SECURITY_ROLES}>
      <RoleShell tabBarStyle={sharedStyles.tabBar} enableForMobile={false} />
    </RoleGuard>
  );
}
