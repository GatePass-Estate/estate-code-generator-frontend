import { Stack } from 'expo-router';

export default function UserProfileLayout() {
  return (
    <Stack>
      <Stack.Screen
        name='index'
        options={{ title: 'User Profile', headerShown: false }}
      />
    </Stack>
  );
}
