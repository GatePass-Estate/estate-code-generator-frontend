import Api from '.';
import { getErrorMessage } from '../helpers';
import type { NotificationListResponse } from '@/src/types/notification';

export async function listNotifications(
  page = 1,
  limit = 20,
  is_read?: boolean
): Promise<NotificationListResponse> {
  try {
    const api = Api();
    const axiosRes = await api.get(`/notifications`, {
      params: { page, limit, ...(typeof is_read === 'boolean' ? { is_read } : {}) },
    });
    return axiosRes.data;
  } catch (error: any) {
    throw new Error(`${getErrorMessage(error) || 'Could not load your activity'}`);
  }
}

export async function getUnreadNotificationCount(): Promise<{ count: number }> {
  try {
    const api = Api();
    const axiosRes = await api.get(`/notifications/unread-count`);
    return axiosRes.data;
  } catch (error: any) {
    throw new Error(`${getErrorMessage(error) || 'Could not load unread count'}`);
  }
}

export async function markNotificationRead(notification_id: string): Promise<{ id?: string }> {
  try {
    const api = Api();
    const axiosRes = await api.patch(`/notifications/${notification_id}/read`);
    return axiosRes.data;
  } catch (error: any) {
    throw new Error(`${getErrorMessage(error) || 'Could not mark this as read'}`);
  }
}

export async function markAllNotificationsRead(): Promise<{ updated?: number }> {
  try {
    const api = Api();
    const axiosRes = await api.patch(`/notifications/read-all`);
    return axiosRes.data;
  } catch (error: any) {
    throw new Error(`${getErrorMessage(error) || 'Could not mark all as read'}`);
  }
}

/** Deletes a single activity item. This is the swipe-to-delete action. */
export async function deleteNotification(notification_id: string): Promise<{ id?: string }> {
  try {
    const api = Api();
    const axiosRes = await api.delete(`/notifications/${notification_id}`);
    return axiosRes.data;
  } catch (error: any) {
    throw new Error(`${getErrorMessage(error) || 'Could not delete this activity'}`);
  }
}

export async function deleteAllNotifications(): Promise<{ deleted?: number }> {
  try {
    const api = Api();
    const axiosRes = await api.delete(`/notifications`);
    return axiosRes.data;
  } catch (error: any) {
    throw new Error(`${getErrorMessage(error) || 'Could not clear your activity'}`);
  }
}

/* ------------------------------------------------------------------ */
/* Push device tokens                                                  */
/* ------------------------------------------------------------------ */

export type DevicePlatform = 'IOS' | 'ANDROID';

/**
 * Registers this device for push.
 *
 * `token` must be an **FCM registration token** — the backend delivers through
 * firebase-admin, so an Expo push token (`ExponentPushToken[...]`) would be
 * rejected.
 */
export async function registerDeviceToken(
  token: string,
  platform: DevicePlatform,
  session_id?: string | null
): Promise<{ id?: string }> {
  try {
    const api = Api();
    const axiosRes = await api.post(`/device-tokens`, {
      token,
      platform,
      ...(session_id ? { session_id } : {}),
    });
    return axiosRes.data;
  } catch (error: any) {
    throw new Error(`${getErrorMessage(error) || 'Could not register this device for push'}`);
  }
}

/** Removes this device's token so a signed-out device stops receiving push. */
export async function unregisterDeviceToken(token: string): Promise<void> {
  try {
    const api = Api();
    await api.delete(`/device-tokens/by-token/${encodeURIComponent(token)}`);
  } catch (error: any) {
    throw new Error(`${getErrorMessage(error) || 'Could not unregister this device'}`);
  }
}
