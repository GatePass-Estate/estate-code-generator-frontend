import NavigationContainer from '@/src/components/common/NavigationContainer';
import { sharedStyles } from '@/src/theme/styles';

export default function RootLayout() {
	return <NavigationContainer tabBarStyle={sharedStyles.tabBar} enableForMobile={false} />;
}
