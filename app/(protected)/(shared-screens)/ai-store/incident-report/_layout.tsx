import { Stack } from 'expo-router';

export default function IncidentReportLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="summary" />
    </Stack>
  );
}
