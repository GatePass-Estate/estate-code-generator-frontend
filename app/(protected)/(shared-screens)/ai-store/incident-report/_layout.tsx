import { Stack } from 'expo-router';

export default function IncidentReportLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="summary" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
