import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import {
  addPushListeners,
  pushSupported,
  registerForPushNotifications,
} from '@/src/lib/pushNotifications';
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
      // Tapping a notification opens the Info Board, where every alert lives.
      onResponse: (broadcastId) => {
        void refreshCounts();
        router.push(broadcastId ? `/info-board/${broadcastId}` : '/info-board');
      },
    });
  }, [router, refreshCounts]);

  return null;
}
