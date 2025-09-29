import { Stack } from 'expo-router';

export default function UserListLayout() {
	return (
		<Stack>
			<Stack.Screen name="index" options={{ title: 'See All Users', headerShown: false }} />
		</Stack>
	);
}
