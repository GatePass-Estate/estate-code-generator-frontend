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
