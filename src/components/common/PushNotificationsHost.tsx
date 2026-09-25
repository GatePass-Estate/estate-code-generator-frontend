import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'expo-router';
import {
  addPushListeners,
  pushSupported,
  registerForPushNotifications,
} from '@/src/lib/pushNotifications';
import { markBroadcastOpened } from '@/src/lib/readBroadcasts';
import { useAuthStore } from '@/src/lib/stores/authStore';
import { useNotificationStore } from '@/src/lib/stores/notificationStore';
import { useUserStore } from '@/src/lib/stores/userStore';

/**
 * Registers this device for push once signed in, and reacts to notifications.
 *
 * Renders nothing — it exists so the listeners live for as long as the user is
 * inside the authenticated part of the app. All `expo-notifications` access
 * goes through `pushNotifications.ts`, which loads that module lazily: it
 * throws on import in Expo Go, so nothing here may import it directly.
 */
export default function PushNotificationsHost() {
  const router = useRouter();
  const pathname = usePathname();
  // Read inside the listener without re-subscribing on every navigation.
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  const userId = useUserStore((state) => state.user_id);
  const sessionId = useAuthStore((state) => state.session_id);
  const refreshCounts = useNotificationStore((state) => state.refreshCounts);

  // Register once per signed-in user rather than on every session-id change.
  const registeredFor = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) {
      registeredFor.current = null;
      return;
    }
    if (registeredFor.current === userId) return;

    registeredFor.current = userId;
    void registerForPushNotifications(sessionId);
  }, [userId, sessionId]);

  useEffect(() => {
    if (!pushSupported) return;

    return addPushListeners({
      // Arriving in the foreground: keep the bell badge honest.
      onReceived: () => void refreshCounts(),
      // Broadcasts open their message; everything else is an activity, so land
      // on the Activities tab with that entry's detail open.
      onResponse: ({ broadcast_id, notification_id }) => {
        void refreshCounts();
        if (broadcast_id) {
          markBroadcastOpened(broadcast_id);
          router.push(`/info-board/${broadcast_id}`);
          return;
        }
        const params = notification_id
          ? { tab: 'activities', notificationId: notification_id }
          : { tab: 'activities' };
        // Already on the Info Board: switch it in place instead of stacking a
        // second copy on top.
        if (pathnameRef.current === '/info-board') {
          router.setParams(params);
          return;
        }
        router.push({ pathname: '/info-board', params });
      },
    });
  }, [router, refreshCounts]);

  return null;
}
