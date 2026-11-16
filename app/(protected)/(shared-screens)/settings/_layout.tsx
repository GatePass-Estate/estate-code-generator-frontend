import { Stack } from 'expo-router';

export default function SettingsLayout() {
  // Parent shared-screens stack already slides. Animating this nested stack too made More
  // appear to open twice on Android.
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
