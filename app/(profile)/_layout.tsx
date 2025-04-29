import { Stack } from 'expo-router';

export default function MyGuestLayout() {
  return (
    <Stack>
      <Stack.Screen name='index' options={{ title: 'Profile' }} />
    </Stack>
  );
}
