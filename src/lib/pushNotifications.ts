import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  registerDeviceToken,
  unregisterDeviceToken,
  type DevicePlatform,
} from '@/src/lib/api/notifications';

/**
 * Push registration.
 *
 * The backend delivers through firebase-admin (`messaging.send_multicast`), so
 * it needs a raw **FCM registration token** — not an Expo push token. That is
 * why this uses `getDevicePushTokenAsync()` rather than
 * `getExpoPushTokenAsync()`.
 *
 * `expo-notifications` is loaded lazily and only where remote notifications
 * actually exist. Expo Go dropped Android push support in SDK 53 and *throws
 * on import*, so a top-level import would crash the app at startup for anyone
 * running in Expo Go — the module is reached from the auth context, which every
 * screen pulls in. Use a development build to exercise push.
 *
 * Platform notes:
 *   - Android returns an FCM token directly, which is what the backend wants.
 *     Requires `google-services.json` in the build.
 *   - iOS returns an **APNs** token. firebase-admin will not accept that as a
 *     registration token, so iOS additionally needs the Firebase iOS SDK (via
 *     `GoogleService-Info.plist`) to exchange APNs -> FCM.
 */

type NotificationsModule = typeof import('expo-notifications');
type NotificationResponse = import('expo-notifications').NotificationResponse;

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
export const pushSupported = Platform.OS !== 'web' && !isExpoGo;

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
    // without it throw below and land in the catch). The iOS simulator is
    // still skipped.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Device = require('expo-device') as typeof import('expo-device');
    if (Platform.OS === 'ios' && !Device.isDevice) return null;

    await ensureAndroidChannel(Notifications);

    if (!(await requestPermission(Notifications))) return null;

    const devicePushToken = await Notifications.getDevicePushTokenAsync();
    const token = String(devicePushToken.data);
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
};

export type PushListeners = {
  onReceived: () => void;
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

  const receivedSub = Notifications.addNotificationReceivedListener(() => onReceived());
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
