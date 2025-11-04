import { Stack } from 'expo-router';

export const unstable_settings = {
	initialRouteName: '(security)',
};

export default function AdminLayout() {
	return (
		<Stack screenOptions={{ headerShown: false, title: 'Incoming Guest' }}>
			<Stack.Screen name="(security)" options={{ headerShown: false }} />
			<Stack.Screen name="(validationResult)" options={{ headerShown: false }} />
		</Stack>
	);
}
