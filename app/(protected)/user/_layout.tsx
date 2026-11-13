import NavigationContainer from '@/src/features/dashboard/components/NavigationContainer';
import { menuRoutes } from '@/src/features/dashboard/components/menuRoutes';
import { sharedStyles } from '@/src/shared/theme/styles';

export default function UserRootLayout() {
  return <NavigationContainer routes={menuRoutes} tabBarStyle={sharedStyles.tabBar} />;
}
