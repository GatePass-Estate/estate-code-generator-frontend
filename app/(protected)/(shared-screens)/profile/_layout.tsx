import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="edit/index" />
      <Stack.Screen name="access-log/index" />
      <Stack.Screen name="access-log/[codeId]/index" />
    </Stack>
  );
}
