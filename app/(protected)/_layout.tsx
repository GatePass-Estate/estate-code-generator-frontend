import 'react-native-reanimated';
import { Redirect, Stack } from 'expo-router';
import PlanGuard from '@/src/features/billing/components/PlanGuard';
import VerifyAccountGuard from '@/src/features/auth/components/VerifyAccountGuard';
import { useAuth } from '@/src/features/auth/hooks/useAuthContext';
import { useAuthStore } from '@/src/features/auth/store/authStore';
import { useEstatePlanFreshness } from '@/src/features/billing/hooks/useEstatePlanFreshness';
import { useUserStore } from '@/src/store/userStore';
import BroadcastPopupHost from '@/src/features/notifications/components/BroadcastPopupHost';
import PushNotificationsHost from '@/src/features/notifications/components/PushNotificationsHost';

export const unstable_settings = {
  // Default into the resident stack; RoleGuard / sign-in replace to admin or security.
  anchor: 'user',
};

export default function ProtectedLayout() {
  const { isReady } = useAuth();
  // Before the early returns below, so the hook order never changes.
  useEstatePlanFreshness();

  const status = useUserStore((state) => state.status);
  // clearUser() resets status to its default (true), so a signed-out user (e.g. browser Back
  // after sign-out) is only caught by the missing session token.
  const hasSession = useAuthStore((state) => Boolean(state.access_token));

  if (!isReady) {
    return null;
  }

  if (!status || !hasSession) {
    return <Redirect href="/auth" />;
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          // Same slide as Admin → Broadcast: More → Admin Tools / Profile / etc.
          animation: 'slide_from_right',
          animationTypeForReplace: 'pop',
        }}
      >
        <Stack.Screen name="user" />
        <Stack.Screen name="admin" />
        <Stack.Screen name="security" />
        <Stack.Screen name="(shared-screens)" />
      </Stack>
      <PlanGuard />
      <VerifyAccountGuard />
      {/* Announcements sit above every signed-in screen. */}
      <BroadcastPopupHost />
      <PushNotificationsHost />
    </>
  );
}
