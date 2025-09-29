import { menuRoutes, menuStyles } from '../user/_layout';
import NavigationContainer from '@/src/components/common/NavigationContainer';

export default function SharedScreenLayout() {
	return <NavigationContainer routes={menuRoutes} tabBarStyle={menuStyles.tabBar} enableForMobile={false} />;
}
