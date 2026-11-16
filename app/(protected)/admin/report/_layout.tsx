import { Stack } from 'expo-router';

export const unstable_settings = {
  anchor: 'index',
};

/** Same slide as Broadcast / other Admin Tools stack screens. */
export default function AdminReportLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
