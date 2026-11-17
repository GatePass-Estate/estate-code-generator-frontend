import { Stack } from 'expo-router';

export const unstable_settings = {
  anchor: 'institution',
};

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen
        name="institution"
        options={{ animation: 'slide_from_left', animationTypeForReplace: 'pop' }}
      />
      <Stack.Screen name="login" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="two-factor" />
      <Stack.Screen name="tos" />
      <Stack.Screen name="set-password" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="data-protection-policy" />
      <Stack.Screen name="email-activation-status" />
      <Stack.Screen name="index" />
    </Stack>
  );
}
