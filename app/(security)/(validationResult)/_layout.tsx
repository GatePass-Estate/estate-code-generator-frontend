import { useAuth } from '@/hooks/useAuthContext';
import { useAuthStore } from '@/lib/stores/authStore';
import { useUserStore } from '@/lib/stores/userStore';
import { Redirect, Stack } from 'expo-router';

export const unstable_settings = {
	initialRouteName: '(security)',
};

export default function AdminLayout() {
	const authState = useAuth();
	const { isReady } = authState;

	const role = useAuthStore((state) => state.role);
	const status = useUserStore((state) => state.status);

	if (!isReady) {
		return null;
	}

	if (!status) {
		return <Redirect href="/login" />;
	}

	if (role !== 'security') {
		return <Redirect href="./(protected)" />;
	}

	return (
		<Stack screenOptions={{ headerShown: false, title: 'Incoming Guest' }}>
			<Stack.Screen name="(security)" options={{ headerShown: false }} />
			<Stack.Screen name="(validationResult)" options={{ headerShown: false }} />
		</Stack>
	);
}
