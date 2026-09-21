import { useCallback } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { BellIcon } from '@/src/assets/svgs';
import { useNotificationStore, selectHasUnread } from '@/src/lib/stores/notificationStore';

/**
 * Header bell with an unread dot, opening the Info Board.
 *
 * The dot reflects unread broadcasts OR unread activity, matching the single
 * badge in the design.
 */
export default function NotificationBell({ color = '#113E55' }: { color?: string }) {
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
      className={Platform.OS === 'web' ? 'mr-2' : 'mr-3'}
      hitSlop={8}
    >
      <View className="h-[38px] w-[38px] items-center justify-center rounded-full bg-[#F6FCFF]">
        <BellIcon color={color} />
        {hasUnread && (
          <View className="absolute right-[7px] top-[7px] h-[9px] w-[9px] rounded-full bg-[#E30404]" />
        )}
      </View>
    </Pressable>
  );
}
