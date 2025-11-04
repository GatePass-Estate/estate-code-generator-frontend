import { View, StyleSheet, Text, Platform } from 'react-native';
import { Image } from 'react-native';
import images from '@/src/constants/images';
import icons from '@/src/constants/icons';
import NavigationContainer from '@/src/components/common/NavigationContainer';
import { sharedStyles } from '@/src/theme/styles';

const FloatingButton: React.FC<{ focused?: boolean }> = ({ focused = false }) => {
	return (
		<View style={[sharedStyles.fab, !focused ? { backgroundColor: '#CEE5ED' } : { backgroundColor: '#113E55' }]}>
			<Image
				source={focused ? icons.plusActive : icons.plus}
				style={{
					marginLeft: -3,
					width: 15,
					height: 15,
					resizeMode: 'contain',
				}}
			/>
		</View>
	);
};

const HomeIcon: React.FC<{ focused?: boolean }> = ({ focused = false }) => (
	<View className="items-center w-80 mt-6 gap-1">
		<Image
			source={focused ? (Platform.OS == 'ios' ? icons.iosHomeActive : images.activeBtnImg) : Platform.OS == 'ios' ? icons.iosHomeInActive : icons.menuIcon}
			style={{
				marginLeft: -3,
				width: 20,
				height: 20,
				resizeMode: 'contain',
			}}
		/>
		<Text style={{ fontSize: 12, fontWeight: focused ? 700 : 500, color: '#113E55' }}>Home</Text>
	</View>
);

const GuestIcon: React.FC<{ focused?: boolean }> = ({ focused = false }) => (
	<View style={{ alignItems: 'center', width: 300, marginTop: 25, gap: 4 }}>
		<Image
			source={focused ? (Platform.OS == 'ios' ? icons.iosGuestActive : images.activeGuestIcon) : Platform.OS == 'ios' ? icons.iosGuestInActive : images.inactiveGuestIcon}
			style={{
				width: 20,
				height: 20,
				resizeMode: 'contain',
			}}
		/>
		<Text style={{ fontSize: 12, fontWeight: focused ? 700 : 500, color: '#113E55' }}>My Guests</Text>
	</View>
);

export const menuRoutes = [
	{ name: 'index', link: '/user', title: 'Home', TabIcon: HomeIcon, for: 'both', activeIcon: icons.activeHomeIcon, inactiveIcon: icons.inactiveHomeIcon },

	{ name: 'guests/add/index', link: '/user/guests/add', title: 'Add Guest', TabIcon: FloatingButton, for: 'native' },

	{ name: 'guests/add/index', link: '/user/guests/add', title: 'Generate Code', TabIcon: FloatingButton, for: 'web', activeIcon: icons.activeCodeIcon, inactiveIcon: icons.inactiveCodeIcon },

	{ name: 'guests/index', link: '/user/guests', title: 'My Guests', TabIcon: GuestIcon, for: 'native' },

	{ name: 'profile/index', link: '/profile', title: 'My Profile', TabIcon: GuestIcon, for: 'web', activeIcon: icons.activeProfileIcon, inactiveIcon: icons.inactiveProfileIcon },

	{ name: 'admin/index', link: '/admin', title: 'Admin Access', for: 'web', activeIcon: icons.activeAdminIcon, inactiveIcon: icons.inactiveAdminIcon },
];

export default function RootLayout() {
	return <NavigationContainer routes={menuRoutes} tabBarStyle={sharedStyles.tabBar} />;
}
