import { useEffect } from 'react';
import { Image, Platform, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import icons from '@/src/shared/constants/icons';
import {
  useNotificationStore,
  selectHasUnread,
} from '@/src/features/notifications/store/notificationStore';
import { getUnreadBroadcastCount } from '@/src/features/notifications/services/broadcast';
import { getUnreadNotificationCount } from '@/src/features/notifications/services/notifications';
import { allowAndroidAction } from '@/src/shared/utils/androidActionLock';
import { queryKeys } from '@/src/shared/services/api/queryKeys';

/**
 * Header bell with an unread dot, opening the Info Board.
 *
 * The dot reflects unread broadcasts OR unread activity, matching the single
 * badge in the design. One look on every home header (Figma: the security
 * header's 24pt bell, dot over the top-right edge).
 */
export default function NotificationBell({
  className = Platform.OS === 'web' ? 'mr-2' : 'mr-3',
}: {
  /** Outer spacing; pass '' when the parent already spaces its children. */
  className?: string;
}) {
  const router = useRouter();
  const hasUnread = useNotificationStore(selectHasUnread);
  const setBroadcastUnread = useNotificationStore((state) => state.setBroadcastUnread);
  const setActivityUnread = useNotificationStore((state) => state.setActivityUnread);

  // PERF-05: shared unread-count query (focusManager refreshes when stale).
  const countsQuery = useQuery({
    queryKey: [...queryKeys.broadcasts.all, 'unread-counts'] as const,
    queryFn: async () => {
      const [broadcasts, activity] = await Promise.allSettled([
        getUnreadBroadcastCount(),
        getUnreadNotificationCount(),
      ]);
      return {
        broadcastUnread: broadcasts.status === 'fulfilled' ? (broadcasts.value?.count ?? 0) : 0,
        activityUnread: activity.status === 'fulfilled' ? (activity.value?.count ?? 0) : 0,
      };
    },
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!countsQuery.data) return;
    setBroadcastUnread(countsQuery.data.broadcastUnread);
    setActivityUnread(countsQuery.data.activityUnread);
  }, [countsQuery.data, setActivityUnread, setBroadcastUnread]);

  return (
    <Pressable
      onPress={() => {
        if (!allowAndroidAction('open:/info-board')) return;
        router.push('/info-board');
      }}
      accessibilityRole="button"
      accessibilityLabel={hasUnread ? 'Info Board, unread items' : 'Info Board'}
      className={className}
      hitSlop={8}
    >
      <View className="h-[38px] w-[38px] items-center justify-center rounded-full bg-surface-bell">
        <Image
          source={icons.notificationBellIcon}
          style={{ width: 24, height: 24 }}
          resizeMode="contain"
        />
        {hasUnread && (
          <View
            className="absolute h-[9px] w-[9px] rounded-full bg-danger-badge"
            style={{ right: 4, top: -3 }}
          />
        )}
      </View>
    </Pressable>
  );
}
