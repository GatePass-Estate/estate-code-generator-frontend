import { Platform, Pressable } from 'react-native';
import { Tabs, Stack, useRouter } from 'expo-router';
import WebSidebar from '../web/WebSidebar';
import { StyleSheet } from 'react-native';

type NavRoute = {
	name: string;
	link: string;
	title: string;
	for: 'web' | 'native' | 'both' | string;
	activeIcon?: any;
	inactiveIcon?: any;
	TabIcon?: React.ComponentType<{ focused?: boolean }>;
};

type NavigationContainerProps = {
	routes: NavRoute[];
	headerStyle?: object;
	tabBarStyle?: object;
	enableForMobile?: boolean;
};

export default function NavigationContainer({ routes, headerStyle, tabBarStyle, enableForMobile = true }: NavigationContainerProps) {
	if (Platform.OS === 'web') {
		return (
			<>
				<Stack
					screenOptions={{
						headerShown: false,
						...headerStyle,
					}}
				></Stack>
			</>
		);
	}

	return enableForMobile ? (
		<Tabs
			screenOptions={{
				tabBarStyle: [{ ...tabBarStyle }],
				tabBarShowLabel: false,
				tabBarActiveTintColor: '#113E55',
				tabBarInactiveTintColor: '#113E55',
				tabBarLabelStyle: { display: 'none' },
				tabBarButton: (props: any) => <Pressable {...props} android_ripple={null} />,
			}}
		>
			{routes
				.filter((el) => el.for == 'native' || el.for == 'both')
				.map(({ name, title, TabIcon }) =>
					TabIcon ? (
						<Tabs.Screen
							key={name}
							name={name}
							options={{
								title,
								headerTitleStyle: {
									color: '#113E55',
									fontFamily: 'UbuntuSans',
									fontWeight: 'bold',
								},

								headerShown: false,
								tabBarIcon: ({ focused }) => (TabIcon ? <TabIcon focused={focused} /> : null),
							}}
						/>
					) : null
				)}
		</Tabs>
	) : (
		<Stack screenOptions={{ headerShown: false }} />
	);
}

const styles = StyleSheet.create({});
