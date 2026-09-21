import 'react-native-reanimated';
import { Redirect, Stack } from 'expo-router';
import PlanGuard from '@/src/components/mobile/PlanGuard';
import { useAuth } from '@/src/hooks/useAuthContext';
import { useUserStore } from '@/src/lib/stores/userStore';
import BroadcastPopupHost from '@/src/components/common/BroadcastPopupHost';
import PushNotificationsHost from '@/src/components/common/PushNotificationsHost';

export const unstable_home_settings = {
  initialRouteName: '(protected)',
};

export default function ProtectedLayout() {
  const { isReady } = useAuth();

  const status = useUserStore((state) => state.status);

  if (!isReady) {
    return null;
  }

  if (!status) {
    return <Redirect href="/auth" />;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="user" />
      </Stack>
      <PlanGuard />
      {/* Announcements sit above every signed-in screen. */}
      <BroadcastPopupHost />
      <PushNotificationsHost />
    </>
  );
}
