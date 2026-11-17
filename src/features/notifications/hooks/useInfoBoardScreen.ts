import { useCallback, useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { useInfoBoard, type InfoBoardTab } from '@/src/features/notifications/hooks/useInfoBoard';
import { useNotificationStore } from '@/src/features/notifications/store/notificationStore';
import {
  nextPushTargetStep,
  type PushTargetState,
} from '@/src/features/notifications/utils/pushTarget';
import type { NotificationItem } from '@/src/features/notifications/types/notification';

/**
 * Screen logic for the Info Board (web and native): the two lists, unread counts,
 * opening a message, the activity detail and the "Clear All" confirmation.
 *
 * `requestedTab` / `notificationId` come from a push-notification tap (native only):
 * which tab to land on, and which activity to open once the list has loaded.
 */
export function useInfoBoardScreen({
  requestedTab,
  notificationId,
}: { requestedTab?: InfoBoardTab; notificationId?: string } = {}) {
  const board = useInfoBoard(requestedTab);
  const { setTab, readBroadcast, readActivity, removeBroadcast, removeActivity, clearCurrentTab } =
    board;
  const { activities, activitiesLoading, refresh } = board;

  const broadcastUnread = useNotificationStore((state) => state.broadcastUnread);
  const activityUnread = useNotificationStore((state) => state.activityUnread);

  const [selectedActivity, setSelectedActivity] = useState<NotificationItem | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  // A tap on another notification while this screen is already open changes
  // the params in place rather than mounting a fresh screen.
  useEffect(() => {
    if (requestedTab) setTab(requestedTab);
  }, [requestedTab, notificationId, setTab]);

  const openActivity = useCallback(
    (item: NotificationItem) => {
      setSelectedActivity(item);
      void readActivity(item.id);
    },
    [readActivity]
  );

  // Open the tapped activity's detail once, as soon as it is in the list. If
  // the screen was already open, the list predates the push, so refetch once.
  const pushTarget = useRef<PushTargetState | null>(null);
  useEffect(() => {
    if (!notificationId || activitiesLoading) return;

    if (pushTarget.current?.id !== notificationId) {
      pushTarget.current = { id: notificationId, refetched: false, done: false };
    }
    const step = nextPushTargetStep(pushTarget.current, activities);
    if (step.kind === 'open') openActivity(step.item);
    else if (step.kind === 'refetch') void refresh();
  }, [notificationId, activities, activitiesLoading, openActivity, refresh]);

  const openBroadcast = useCallback(
    (id: string) => {
      void readBroadcast(id);
      router.push(`/info-board/${id}`);
    },
    [readBroadcast]
  );

  const handleConfirmClear = useCallback(async () => {
    await clearCurrentTab();
    setConfirmClear(false);
  }, [clearCurrentTab]);

  const handleRemoveBroadcast = useCallback(
    (id: string) => void removeBroadcast(id),
    [removeBroadcast]
  );
  const handleRemoveActivity = useCallback(
    (id: string) => void removeActivity(id),
    [removeActivity]
  );

  return {
    ...board,
    isMessages: board.tab === 'message',
    broadcastUnread,
    activityUnread,
    openBroadcast,
    openActivity,
    selectedActivity,
    closeActivity: () => setSelectedActivity(null),
    confirmClear,
    setConfirmClear,
    handleConfirmClear,
    handleRemoveBroadcast,
    handleRemoveActivity,
  };
}
