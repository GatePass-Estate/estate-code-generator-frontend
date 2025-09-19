import { Redirect, Stack } from 'expo-router';
import 'react-native-reanimated';
import { useAuth } from '@/hooks/useAuthContext';
import { useAuthStore } from '@/lib/stores/authStore';
import { useUserStore } from '@/lib/stores/userStore';

export const unstable_home_settings = {
	initialRouteName: '(tabs)',
};

export default function ProtectedLayout() {
	const { isReady } = useAuth();

	const role = useAuthStore((state) => state.role);
	const status = useUserStore((state) => state.status);

	if (!isReady) {
		return null;
	}

	if (!status) {
		return <Redirect href="/login" />;
	}

	if (role === 'admin') {
		return <Redirect href="/(admin)" />;
	}
	if (role === 'security') {
		return <Redirect href="/(security)" />;
	}

	return (
		<Stack>
			<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
		</Stack>
	);
}
