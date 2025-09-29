import { Redirect, Stack } from 'expo-router';
import 'react-native-reanimated';
import { useAuth } from '@/src/hooks/useAuthContext';
import { useAuthStore } from '@/src/lib/stores/authStore';
import { useUserStore } from '@/src/lib/stores/userStore';

export const unstable_home_settings = {
	initialRouteName: '(protected)',
};

export default function ProtectedLayout() {
	const { isReady } = useAuth();

	const role = useAuthStore((state) => state.role);
	const status = useUserStore((state) => state.status);

	if (!isReady) {
		return null;
	}

	if (!status) {
		return <Redirect href="/auth" />;
	}

	if (role === 'admin') {
		return <Redirect href="/admin" />;
	}
	if (role === 'security') {
		return <Redirect href="/security" />;
	}

	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Screen name="user" />
		</Stack>
	);
}
