import { useAuth } from '@/hooks/useAuthContext';
import { useAuthStore } from '@/lib/stores/authStore';
import { useUserStore } from '@/lib/stores/userStore';
import { Redirect, Stack } from 'expo-router';

export const unstable_settings = {
	initialRouteName: 'dashboard', // Default admin screen
};

export default function AdminLayout() {
	const { isReady } = useAuth();

	const role = useAuthStore((state) => state.role);
	const status = useUserStore((state) => state.status);

	// Ensure auth state is fully loaded
	if (!isReady) return null;

	// Redirect unauthenticated users
	if (!status) {
		return <Redirect href="/login" />;
	}

	// Restrict access to only primary_admin and root roles
	const isAuthorizedAdmin = ['primary_admin', 'root'].includes(role || '');

	if (!isAuthorizedAdmin) {
		return <Redirect href="/(protected)/(tabs)/(home)" />;
	}

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
