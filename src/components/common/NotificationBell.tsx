import { useCallback } from 'react';
import { Image, Platform, Pressable, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import icons from '@/src/constants/icons';
import { useNotificationStore, selectHasUnread } from '@/src/lib/stores/notificationStore';

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
  const refreshCounts = useNotificationStore((state) => state.refreshCounts);

  // Refresh whenever the hosting screen regains focus so the badge reflects
  // actions taken elsewhere (reading a message, clearing activity).
  useFocusEffect(
    useCallback(() => {
      void refreshCounts();
    }, [refreshCounts])
  );

  return (
    <Pressable
      onPress={() => router.push('/info-board')}
      accessibilityRole="button"
      accessibilityLabel={hasUnread ? 'Info Board, unread items' : 'Info Board'}
      className={className}
      hitSlop={8}
    >
      <View className="h-[38px] w-[38px] items-center justify-center rounded-full bg-[#F6FCFF]">
        <Image
          source={icons.notificationBellIcon}
          style={{ width: 24, height: 24 }}
          resizeMode="contain"
        />
        {hasUnread && (
          <View
            className="absolute h-[9px] w-[9px] rounded-full bg-[#E30404]"
            style={{ right: 4, top: -3 }}
          />
        )}
      </View>
    </Pressable>
  );
}
