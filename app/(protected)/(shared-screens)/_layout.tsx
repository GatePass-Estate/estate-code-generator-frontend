import { sharedStyles } from '@/src/shared/theme/styles';
import { menuRoutes } from '@/src/features/dashboard/components/menuRoutes';
import NavigationContainer from '@/src/features/dashboard/components/NavigationContainer';

export default function SharedScreenLayout() {
  return (
    <NavigationContainer
      routes={menuRoutes}
      tabBarStyle={sharedStyles.tabBar}
      enableForMobile={false}
    />
  );
}
