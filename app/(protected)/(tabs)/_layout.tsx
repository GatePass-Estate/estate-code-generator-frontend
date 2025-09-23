import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Image } from 'react-native';
import images from '@/constants/images';
import icons from '@/constants/icons';

const Tab = createBottomTabNavigator();

// Custom Floating Button
const FloatingButton = ({ focused }: any) => {
	return (
		<View style={[styles.fab, !focused ? { backgroundColor: '#CEE5ED' } : { backgroundColor: '#113E55' }]}>
			<FontAwesome name="plus" size={20} color={`${focused ? '#CEE5ED' : '#113E55'}`} />
		</View>
	);
};

export default function UserTab() {
	return (
		<Tabs
			screenOptions={{
				tabBarStyle: styles.tabBar,
				tabBarShowLabel: true,
				tabBarActiveTintColor: '#113E55',
				tabBarInactiveTintColor: '#113E55',
				tabBarLabelStyle: { display: 'none' },
				tabBarButton: (props: any) => <Pressable {...props} android_ripple={null} />,
			}}
		>
			<Tabs.Screen
				name="(home)"
				options={{
					animation: 'none',
					title: 'Home',
					headerShown: false,
					headerTitleStyle: {
						color: '#000',
					},
					tabBarIcon: ({ focused }) => (
						<View className="items-center w-80 mt-6 gap-1">
							<Image
								source={focused ? images.activeBtnImg : icons.menuIcon}
								style={{
									marginLeft: -3,
									width: 30,
									height: 25,
									resizeMode: 'contain',
								}}
							/>
							<Text style={{ fontSize: 12, fontWeight: focused ? 700 : 500, color: '#113E55' }}>Home</Text>
						</View>
					),
				}}
			/>

			<Tabs.Screen
				name="(AddGuest)"
				options={{
					title: 'Add Guest',
					headerTitleStyle: {
						color: '#113E55',
						fontFamily: 'UbuntuSans',
						fontWeight: 'bold',
					},
					headerShown: false,
					tabBarIcon: (props) => <FloatingButton {...props} />,
				}}
			/>

			<Tabs.Screen
				name="(MyGuest)"
				options={{
					title: 'My Guests',
					headerShown: false,
					headerTitleStyle: {
						color: '#113E55',
						fontFamily: 'UbuntuSans',
						fontWeight: 'bold',
					},
					tabBarIcon: ({ focused }) => (
						<View style={{ alignItems: 'center', width: 300, marginTop: 25, gap: 4 }}>
							<Image
								source={focused ? require('@/assets/images/active-account.png') : require('@/assets/icons/Guest-icon.png')}
								style={{
									width: 30,
									height: 30,
									resizeMode: 'contain',
								}}
							/>
							<Text style={{ fontSize: 12, fontWeight: focused ? 700 : 500, color: '#113E55' }}>My Guests</Text>
						</View>
					),
				}}
			/>
		</Tabs>
	);
}

const styles = StyleSheet.create({
	tabBar: {
		position: 'absolute',
		backgroundColor: '#CEE5ED',
		height: 80,
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',

		// Remove shadow (iOS and Android)
		elevation: 0, // Android
		shadowColor: 'transparent', // iOS
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0,
		shadowRadius: 0,
		borderTopWidth: 0,
	},

	fab: {
		top: -20,
		width: 90,
		height: 90,
		borderRadius: 50,
		borderColor: '#FBFEFF',
		borderWidth: 6,
		justifyContent: 'center',
		alignItems: 'center',

		// Remove shadow
		elevation: 0,
		shadowColor: 'transparent',
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0,
		shadowRadius: 0,
	},
});
