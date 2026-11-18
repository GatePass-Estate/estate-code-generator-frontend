import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  registerDeviceToken,
  unregisterDeviceToken,
  type DevicePlatform,
} from '@/src/features/notifications/services/notifications';

/**
 * Push registration.
 *
 * The backend delivers through firebase-admin (`messaging.send_multicast`), so
 * it needs a raw **FCM registration token** — not an Expo push token. The token
 * comes from React Native Firebase (`@react-native-firebase/messaging`), which
 * returns an FCM token on both platforms (on iOS it exchanges the APNs token
 * for an FCM one via `GoogleService-Info.plist`).
 *
 * `expo-notifications` is still used for the permission prompt, foreground
 * notification display and tap handling — only the token comes from Firebase.
 *
 * Both native modules are loaded lazily and only where remote notifications
 * actually exist. Expo Go dropped Android push support in SDK 53 and *throws
 * on import*, so a top-level import would crash the app at startup for anyone
 * running in Expo Go — the module is reached from the auth context, which every
 * screen pulls in. Use a development build to exercise push.
 *
 * Platform notes:
 *   - Requires `google-services.json` (Android) / `GoogleService-Info.plist`
 *     (iOS) in the build.
 *   - If the installed binary predates `@react-native-firebase/messaging`,
 *     Android falls back to the native FCM token from `expo-notifications`;
 *     iOS cannot (that would be an APNs token), so it skips registration.
 */

type NotificationsModule = typeof import('expo-notifications');
type NotificationResponse = import('expo-notifications').NotificationResponse;
type FirebaseMessagingModule = typeof import('@react-native-firebase/messaging');

const STORED_TOKEN_KEY = 'gatepass-push-token';

/**
 * Expo Go cannot do remote notifications from SDK 53 onwards.
 *
 * Checked against the literal as well as the enum: if this comparison ever
 * silently evaluated false we would import `expo-notifications` in Expo Go and
 * crash the whole app at startup, so it is worth being blunt. `appOwnership`
 * is a deprecated fallback for older runtimes.
 */
// Widened to string so TypeScript does not narrow away the literal check.
const executionEnvironment: string = Constants.executionEnvironment;
const isExpoGo =
  executionEnvironment === ExecutionEnvironment.StoreClient ||
  executionEnvironment === 'storeClient' ||
  Constants.appOwnership === 'expo';

/** True when this runtime can register for remote notifications at all. */
export const pushSupported =
  Platform.OS !== 'web' && !isExpoGo && !(Platform.OS === 'ios' && !Device.isDevice);

let cachedModule: NotificationsModule | null = null;
let handlerConfigured = false;

/** Loads expo-notifications on first use, or null where push cannot work. */
function loadNotifications(): NotificationsModule | null {
  if (!pushSupported) return null;
  if (cachedModule) return cachedModule;

  try {
    // Deliberately a runtime require so the import never executes in Expo Go.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedModule = require('expo-notifications') as NotificationsModule;
  } catch {
    return null;
  }

  if (!handlerConfigured && cachedModule) {
    handlerConfigured = true;
    // Foreground presentation: show the banner instead of swallowing it.
    cachedModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }

  return cachedModule;
}

let cachedMessaging: FirebaseMessagingModule | null = null;

/**
 * Loads React Native Firebase messaging on first use, or null where it is
 * unavailable (Expo Go, web, or a binary built before the module was added).
 */
function loadMessaging(): FirebaseMessagingModule | null {
  if (!pushSupported) return null;
  if (cachedMessaging) return cachedMessaging;

  try {
    // Runtime require for the same reason as expo-notifications: never run native
    // module code in Expo Go, and tolerate older binaries that lack the module.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedMessaging = require('@react-native-firebase/messaging') as FirebaseMessagingModule;
  } catch {
    return null;
  }

  return cachedMessaging;
}

/** The FCM registration token the backend needs, or null if none can be obtained. */
async function getFcmToken(Notifications: NotificationsModule): Promise<string | null> {
  const messaging = loadMessaging();
  if (messaging) {
    const token = await messaging.getToken(messaging.getMessaging());
    return token ? String(token) : null;
  }

  // Older binary without the Firebase module: Android's native token is already an FCM token.
  if (Platform.OS === 'android') {
    const devicePushToken = await Notifications.getDevicePushTokenAsync();
    const token = String(devicePushToken.data);
    return token || null;
  }

  return null;
}

/** Android requires an explicit channel or notifications arrive silently. */
async function ensureAndroidChannel(Notifications: NotificationsModule): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('default', {
    name: 'GatePass alerts',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#113E55',
  });
}

async function requestPermission(Notifications: NotificationsModule): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;

  // Only ask while we can still be granted; a hard denial must not re-prompt.
  if (!existing.canAskAgain) return false;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/**
 * Registers this device with the backend. Safe to call on every sign-in.
 *
 * Returns the token, or null when push is unavailable (Expo Go, web, the iOS
 * simulator, an Android emulator without Google Play services, permission
 * denied, or iOS without the Firebase SDK configured).
 */
export async function registerForPushNotifications(
  sessionId?: string | null
): Promise<string | null> {
  const Notifications = loadNotifications();
  if (!Notifications) return null;

  try {
    // Android emulators with Google Play services get real FCM tokens (ones
    // without it throw below and land in the catch). iOS simulators are
    // excluded by `pushSupported` before expo-notifications is imported.

    await ensureAndroidChannel(Notifications);

    if (!(await requestPermission(Notifications))) return null;

    const token = await getFcmToken(Notifications);
    if (!token) return null;

    const platform: DevicePlatform = Platform.OS === 'ios' ? 'IOS' : 'ANDROID';
    await registerDeviceToken(token, platform, sessionId ?? null);
    await AsyncStorage.setItem(STORED_TOKEN_KEY, token);

    return token;
  } catch {
    // Push is an enhancement: never let it break sign-in.
    return null;
  }
}

/**
 * Re-registers with the backend whenever Firebase rotates this device's FCM token, so push keeps
 * working without a fresh sign-in. Returns a cleanup function; a no-op where Firebase messaging
 * is unavailable.
 *
 * `getSessionId` is read at refresh time so the latest session is always the one sent.
 */
export function addPushTokenRefreshListener(
  getSessionId: () => string | null | undefined
): () => void {
  const messaging = loadMessaging();
  if (!messaging) return () => {};

  const platform: DevicePlatform = Platform.OS === 'ios' ? 'IOS' : 'ANDROID';

  try {
    return messaging.onTokenRefresh(messaging.getMessaging(), (newToken) => {
      const token = String(newToken ?? '');
      if (!token) return;

      void registerDeviceToken(token, platform, getSessionId() ?? null)
        .then(() => AsyncStorage.setItem(STORED_TOKEN_KEY, token))
        .catch(() => {
          // Push is an enhancement; the next sign-in registers again.
        });
    });
  } catch {
    return () => {};
  }
}

/** Removes this device's token on sign-out so it stops receiving push. */
export async function unregisterForPushNotifications(): Promise<void> {
  if (!pushSupported) return;

  try {
    const token = await AsyncStorage.getItem(STORED_TOKEN_KEY);
    if (!token) return;

    await unregisterDeviceToken(token);
    await AsyncStorage.removeItem(STORED_TOKEN_KEY);
  } catch {
    // Clear locally even if the server call failed, so the next sign-in
    // re-registers cleanly rather than reusing a token we think is stale.
    await AsyncStorage.removeItem(STORED_TOKEN_KEY).catch(() => {});
  }
}

/** The `data` block the notification service attaches to every push. */
export type PushPayload = {
  /** NotificationType value, e.g. `BROADCAST_HIGH` or `LOGIN_NEW_DEVICE`. */
  type?: string;
  /** Row id in the user's activity feed. */
  notification_id?: string;
  /** Present only on broadcast pushes. */
  broadcast_id?: string;
  /**
   * The rest of the notification's metadata, flattened in as strings (a null value arrives as
   * "None") — e.g. `prediction_result_id` on `SPATIAL_ANOMALY_DETECTED`.
   */
  [key: string]: string | undefined;
};

export type PushListeners = {
  onReceived: (payload: PushPayload) => void;
  onResponse: (payload: PushPayload) => void;
};

// Identifiers of taps already routed, so a response seen both by the listener
// and by the cold-start check below is only acted on once.
const handledResponses = new Set<string>();

/**
 * Subscribes to notification events. Returns a cleanup function, and is a
 * no-op where push is unsupported — callers need no environment checks.
 */
export function addPushListeners({ onReceived, onResponse }: PushListeners): () => void {
  const Notifications = loadNotifications();
  if (!Notifications) return () => {};

  const handleResponse = (response: NotificationResponse) => {
    const id = response.notification.request.identifier;
    if (handledResponses.has(id)) return;
    handledResponses.add(id);

    // The last response is kept natively until cleared; clearing it stops a
    // later remount (e.g. signing in again) from replaying this tap.
    try {
      Notifications.clearLastNotificationResponse();
    } catch {
      // Not available on this platform — the identifier set still dedupes.
    }

    onResponse((response.notification.request.content.data ?? {}) as PushPayload);
  };

  const receivedSub = Notifications.addNotificationReceivedListener((notification) =>
    onReceived((notification.request.content.data ?? {}) as PushPayload)
  );
  const responseSub = Notifications.addNotificationResponseReceivedListener(handleResponse);

  // A tap that launched the app from a killed state can land before this
  // listener exists, so pick it up here.
  try {
    const initial = Notifications.getLastNotificationResponse();
    if (initial) handleResponse(initial);
  } catch {
    // Unavailable on this platform.
  }

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}
