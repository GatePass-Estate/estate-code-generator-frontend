import { Stack } from 'expo-router';

export default function AdminLayout() {
	// Render admin-only stack
	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Screen name="dashboard" />
			<Stack.Screen name="userList" />
			<Stack.Screen name="userProfile" />
			<Stack.Screen name="adminReg" />
		</Stack>
	);
}
