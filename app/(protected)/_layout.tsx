import 'react-native-reanimated';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/src/hooks/useAuthContext';
import { useUserStore } from '@/src/lib/stores/userStore';

export const unstable_home_settings = {
	initialRouteName: '(protected)',
};

export default function ProtectedLayout() {
	const { isReady } = useAuth();

	const status = useUserStore((state) => state.status);

	if (!isReady) {
		return null;
	}

	if (!status) {
		return <Redirect href="/auth" />;
	}

	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Screen name="user" />
		</Stack>
	);
}
