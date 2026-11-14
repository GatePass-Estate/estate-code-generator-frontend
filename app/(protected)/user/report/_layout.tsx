import { Stack } from 'expo-router';

export const unstable_settings = {
  anchor: 'index',
};

export default function ReportLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'none' }} />;
}
