import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'expo-router';
import {
  addPushListeners,
  pushSupported,
  registerForPushNotifications,
} from '@/src/features/notifications/services/pushNotifications';
import { refreshEstateEntitlements } from '@/src/features/billing';
import { markNotificationRead } from '@/src/features/notifications/services/notifications';
import {
  ANOMALY_NOTIFICATION_TYPE,
  anomalyRoute,
  isPlanChangeNotification,
} from '@/src/features/notifications/utils/notificationDetail';
import { markBroadcastOpened } from '@/src/features/notifications/utils/readBroadcasts';
import { useAuthStore } from '@/src/features/auth/store/authStore';
import { useNotificationStore } from '@/src/features/notifications/store/notificationStore';
import { useUserStore } from '@/src/store/userStore';

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
      // Arriving in the foreground: keep the bell badge honest, and pick up a
      // plan change (subscription lapse, renewal, ...) straight away.
      onReceived: ({ type }) => {
        void refreshCounts();
        if (isPlanChangeNotification(type)) refreshEstateEntitlements();
      },
      // Broadcasts open their message and anomaly alerts the flagged scan;
      // everything else is an activity, so land on the Activities tab with that
      // entry's detail open.
      onResponse: (payload) => {
        const { broadcast_id, notification_id, type } = payload;
        if (isPlanChangeNotification(type)) refreshEstateEntitlements();
        if (type === ANOMALY_NOTIFICATION_TYPE) {
          // Skipping the Info Board skips the read-on-open it does, so mark it here.
          const markRead = notification_id
            ? markNotificationRead(notification_id).catch(() => {})
            : Promise.resolve();
          void markRead.finally(() => void refreshCounts());
          router.push(anomalyRoute(payload));
          return;
        }
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
