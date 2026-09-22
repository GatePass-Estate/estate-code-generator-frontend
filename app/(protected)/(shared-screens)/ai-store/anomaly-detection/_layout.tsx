import { Stack } from 'expo-router';

export default function AnomalyDetectionLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="summary" />
      <Stack.Screen name="user/[id]" />
    </Stack>
  );
}
