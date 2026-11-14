import { Stack } from 'expo-router';

export const unstable_settings = {
  anchor: 'index',
};

export default function HistoryLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'none' }} />;
}
