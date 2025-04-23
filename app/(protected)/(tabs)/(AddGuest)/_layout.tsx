import { Stack } from 'expo-router';

export default function AddGuestLayout() {
  return (
    <Stack>
      <Stack.Screen
        name='index'
        options={{ title: 'Add Guest', headerShown: false }}
      />
    </Stack>
  );
}
