import { Platform, Pressable } from 'react-native';
import { Tabs, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';
import { menuRouteType } from '@/src/types/general';

type NavigationContainerProps = {
	routes?: menuRouteType[];
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
						title: 'Estate Code Generator',
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
				tabBarLabelStyle: { display: 'none', fontFamily: 'UbuntuSans' },
				tabBarButton: (props: any) => <Pressable {...props} android_ripple={null} />,
			}}
		>
			{routes &&
				routes
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
										fontWeight: 'semibold',
									},

									headerShown: false,
									tabBarIcon: ({ focused }) => (TabIcon ? <TabIcon focused={focused} /> : null),
								}}
							/>
						) : null,
					)}
		</Tabs>
	) : (
		<Stack screenOptions={{ headerShown: false }} />
	);
}

const styles = StyleSheet.create({});
