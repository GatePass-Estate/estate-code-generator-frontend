import { sharedStyles } from '@/src/theme/styles';
import NavigationContainer from '@/src/components/common/NavigationContainer';
import { adminMenuRouteType } from '@/src/types/general';
import icons from '@/src/constants/icons';

export const adminRoutes: adminMenuRouteType[] = [
	{ name: 'guests/add/index', link: '/admin', title: 'See All Users', icon: icons.activeProfileIcon },

	{ name: 'guests/add/index', link: '/admin/users/add', title: 'Register User', icon: icons.addUserIcon },

	{ name: 'guests/add/index', link: '/admin/broadcast', title: 'Send a broadcast', icon: icons.broadcastIcon },

	{ name: 'guests/add/index', link: '/admin/edit-requests', title: 'Edit Requests', icon: icons.editRequestIcon },
];

export default function AdminScreenLayout() {
	return <NavigationContainer routes={adminRoutes} tabBarStyle={sharedStyles.tabBar} enableForMobile={false} />;
}
