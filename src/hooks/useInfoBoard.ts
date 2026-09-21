import { useCallback, useEffect, useState } from 'react';
import {
  dismissAllBroadcasts,
  dismissBroadcast,
  listBroadcasts,
  markBroadcastRead,
} from '@/src/lib/api/broadcast';
import {
  deleteAllNotifications,
  deleteNotification,
  listNotifications,
  markNotificationRead,
} from '@/src/lib/api/notifications';
import { useNotificationStore } from '@/src/lib/stores/notificationStore';
import type { BroadcastItem } from '@/src/types/broadcast';
import type { NotificationItem } from '@/src/types/notification';

export type InfoBoardTab = 'message' | 'activities';

/**
 * Backs the Info Board's two tabs.
 *
 * Both lists are fetched up-front so switching tabs is instant and the unread
 * dots are accurate without a second round-trip. Mutations update local state
 * optimistically and reconcile the shared unread counts.
 */
export function useInfoBoard() {
  const [tab, setTab] = useState<InfoBoardTab>('message');
  const [broadcasts, setBroadcasts] = useState<BroadcastItem[]>([]);
  const [activities, setActivities] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const setBroadcastUnread = useNotificationStore((state) => state.setBroadcastUnread);
  const setActivityUnread = useNotificationStore((state) => state.setActivityUnread);
  const refreshCounts = useNotificationStore((state) => state.refreshCounts);

  const load = useCallback(async () => {
    setErrorMessage('');
    // Settled: an empty or failing broadcast list should not hide activity.
    const [broadcastResult, activityResult] = await Promise.allSettled([
      listBroadcasts(1, 50),
      listNotifications(1, 50),
    ]);

    if (broadcastResult.status === 'fulfilled') {
      setBroadcasts(broadcastResult.value?.items ?? []);
    }
    if (activityResult.status === 'fulfilled') {
      setActivities(activityResult.value?.items ?? []);
    }

    if (broadcastResult.status === 'rejected' && activityResult.status === 'rejected') {
      setErrorMessage(
        (broadcastResult.reason as Error)?.message || 'Could not load your Info Board.'
      );
    }

    setLoading(false);
    setRefreshing(false);
    void refreshCounts();
  }, [refreshCounts]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    return load();
  }, [load]);

  /** Marks a broadcast read and drops the unread count by one. */
  const readBroadcast = useCallback(
    async (id: string) => {
      const target = broadcasts.find((item) => item.id === id);
      if (!target || target.is_read) return;

      setBroadcasts((current) =>
        current.map((item) => (item.id === id ? { ...item, is_read: true } : item))
      );
      setBroadcastUnread(useNotificationStore.getState().broadcastUnread - 1);

      try {
        await markBroadcastRead(id);
      } catch {
        // Re-sync from the server rather than guessing at the true state.
        void load();
      }
    },
    [broadcasts, setBroadcastUnread, load]
  );

  /** Removes one broadcast from this user's list (swipe-left). */
  const removeBroadcast = useCallback(
    async (id: string) => {
      const previous = broadcasts;
      const target = previous.find((item) => item.id === id);
      setBroadcasts((current) => current.filter((item) => item.id !== id));

      try {
        await dismissBroadcast(id);
        if (target && !target.is_read) {
          setBroadcastUnread(useNotificationStore.getState().broadcastUnread - 1);
        }
      } catch (error: any) {
        // Restore the row so the list never silently loses an item — AD-category
        // broadcasts are rejected by the API on purpose.
        setBroadcasts(previous);
        setErrorMessage(error?.message || 'Could not remove this message.');
      }
    },
    [broadcasts, setBroadcastUnread]
  );

  const readActivity = useCallback(
    async (id: string) => {
      const target = activities.find((item) => item.id === id);
      if (!target || target.is_read) return;

      setActivities((current) =>
        current.map((item) => (item.id === id ? { ...item, is_read: true } : item))
      );
      setActivityUnread(useNotificationStore.getState().activityUnread - 1);

      try {
        await markNotificationRead(id);
      } catch {
        void load();
      }
    },
    [activities, setActivityUnread, load]
  );

  /** Deletes one activity item (swipe-left). */
  const removeActivity = useCallback(
    async (id: string) => {
      const previous = activities;
      const target = previous.find((item) => item.id === id);
      setActivities((current) => current.filter((item) => item.id !== id));

      try {
        await deleteNotification(id);
        if (target && !target.is_read) {
          setActivityUnread(useNotificationStore.getState().activityUnread - 1);
        }
      } catch (error: any) {
        setActivities(previous);
        setErrorMessage(error?.message || 'Could not delete this activity.');
      }
    },
    [activities, setActivityUnread]
  );

  /** "Clear All" — scoped to whichever tab is showing. */
  const clearCurrentTab = useCallback(async () => {
    setBusy(true);
    setErrorMessage('');
    try {
      if (tab === 'message') {
        await dismissAllBroadcasts();
        setBroadcasts([]);
        setBroadcastUnread(0);
      } else {
        await deleteAllNotifications();
        setActivities([]);
        setActivityUnread(0);
      }
    } catch (error: any) {
      setErrorMessage(error?.message || 'Could not clear this list.');
      void load();
    } finally {
      setBusy(false);
    }
  }, [tab, setBroadcastUnread, setActivityUnread, load]);

  return {
    tab,
    setTab,
    broadcasts,
    activities,
    loading,
    refreshing,
    refresh,
    errorMessage,
    setErrorMessage,
    busy,
    readBroadcast,
    removeBroadcast,
    readActivity,
    removeActivity,
    clearCurrentTab,
    hasItems: tab === 'message' ? broadcasts.length > 0 : activities.length > 0,
  };
}
