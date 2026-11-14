import { sharedStyles } from '@/src/shared/theme/styles';
import { menuRoutes } from '@/src/features/dashboard/components/menuRoutes';
import RoleShell from '@/src/features/dashboard/components/RoleShell';

export default function SharedScreenLayout() {
  return (
    <RoleShell routes={menuRoutes} tabBarStyle={sharedStyles.tabBar} enableForMobile={false} />
  );
}
