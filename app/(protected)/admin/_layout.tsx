import { sharedStyles } from '@/src/shared/theme/styles';
import NavigationContainer from '@/src/features/dashboard/components/NavigationContainer';
import { adminRoutes } from '@/src/features/dashboard/components/menuRoutes';

export default function AdminScreenLayout() {
  return (
    <NavigationContainer
      routes={adminRoutes}
      tabBarStyle={sharedStyles.tabBar}
      enableForMobile={false}
    />
  );
}
