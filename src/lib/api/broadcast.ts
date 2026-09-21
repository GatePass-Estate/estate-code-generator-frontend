import Api from '.';
import { getErrorMessage } from '../helpers';
import type {
  BroadcastItem,
  BroadcastListResponse,
  CreateBroadcastPayload,
} from '@/src/types/broadcast';

/** Broadcasts visible to the current user. Dismissed ones are already excluded. */
export async function listBroadcasts(page = 1, limit = 20): Promise<BroadcastListResponse> {
  try {
    const api = Api();
    const axiosRes = await api.get(`/broadcasts`, { params: { page, limit } });
    return axiosRes.data;
  } catch (error: any) {
    throw new Error(`${getErrorMessage(error) || 'Could not load messages'}`);
  }
}

export async function getBroadcast(broadcast_id: string): Promise<BroadcastItem> {
  try {
    const api = Api();
    const axiosRes = await api.get(`/broadcasts/${broadcast_id}`);
    return axiosRes.data;
  } catch (error: any) {
    throw new Error(`${getErrorMessage(error) || 'Could not load this message'}`);
  }
}

export async function getUnreadBroadcastCount(): Promise<{ count: number }> {
  try {
    const api = Api();
    const axiosRes = await api.get(`/broadcasts/unread-count`);
    return axiosRes.data;
  } catch (error: any) {
    throw new Error(`${getErrorMessage(error) || 'Could not load unread count'}`);
  }
}

/**
 * Marks a broadcast read for this user. The item stays in their list — it just
 * stops counting as unread, which is what the popup's "Got it!" does.
 */
export async function markBroadcastRead(broadcast_id: string): Promise<{ id: string }> {
  try {
    const api = Api();
    const axiosRes = await api.post(`/broadcasts/${broadcast_id}/read`);
    return axiosRes.data;
  } catch (error: any) {
    throw new Error(`${getErrorMessage(error) || 'Could not mark this as read'}`);
  }
}

/**
 * Removes a broadcast from this user's list only (it stays live for everyone
 * else). This is the swipe-to-delete action.
 *
 * AD-category broadcasts are rejected by the API with a 400.
 */
export async function dismissBroadcast(broadcast_id: string): Promise<{ id: string }> {
  try {
    const api = Api();
    const axiosRes = await api.post(`/broadcasts/${broadcast_id}/dismiss`);
    return axiosRes.data;
  } catch (error: any) {
    throw new Error(`${getErrorMessage(error) || 'Could not remove this message'}`);
  }
}

/** Clears every dismissible broadcast from this user's list. */
export async function dismissAllBroadcasts(): Promise<{ dismissed?: number }> {
  try {
    const api = Api();
    const axiosRes = await api.post(`/broadcasts/dismiss-all`);
    return axiosRes.data;
  } catch (error: any) {
    throw new Error(`${getErrorMessage(error) || 'Could not clear your messages'}`);
  }
}

/** Admin/primary-admin only: sends a new broadcast. */
export async function createBroadcast(payload: CreateBroadcastPayload): Promise<{ id: string }> {
  try {
    const api = Api();
    const axiosRes = await api.post(`/broadcasts`, payload);
    return axiosRes.data;
  } catch (error: any) {
    throw new Error(`${getErrorMessage(error) || 'Could not send broadcast'}`);
  }
}
