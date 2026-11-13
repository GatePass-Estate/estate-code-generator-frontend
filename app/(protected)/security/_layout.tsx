import NavigationContainer from '@/src/features/dashboard/components/NavigationContainer';
import { sharedStyles } from '@/src/shared/theme/styles';

export default function RootLayout() {
  return <NavigationContainer tabBarStyle={sharedStyles.tabBar} enableForMobile={false} />;
}
