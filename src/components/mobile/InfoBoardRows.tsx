import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import SwipeableRow from './SwipeableRow';
import { ActivityAlertIcon, PriorityAlarmIcon } from '@/src/assets/svgs';
import { isAlertNotification, priorityStyle, relativeTime } from '@/src/lib/broadcastStyle';
import type { BroadcastItem } from '@/src/types/broadcast';
import type { NotificationItem } from '@/src/types/notification';

export const BroadcastRow = memo(function BroadcastRow({
  item,
  onOpen,
  onRemove,
}: {
  item: BroadcastItem;
  onOpen: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const style = priorityStyle(item.priority);

  return (
    <SwipeableRow
      onSwipeLeft={() => onRemove(item.id)}
      onSwipeRight={() => onOpen(item.id)}
      leftActionLabel="Open"
      rightActionLabel="Delete"
    >
      <Pressable
        onPress={() => onOpen(item.id)}
        className="flex-row items-center rounded-[8px] border px-4 py-3"
        style={{ backgroundColor: style.background, borderColor: style.border }}
      >
        <PriorityAlarmIcon color={style.icon} circleColor={style.circle} />

        <View className="flex-1 px-3">
          <Text
            className="text-[#0A1F29] text-sm"
            style={{ fontFamily: item.is_read ? 'Inter_18pt-Light' : 'Inter_18pt-SemiBold' }}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text className="text-[#878686] font-inter-regular text-[11px] mt-0.5" numberOfLines={1}>
            {item.message}
          </Text>
        </View>

        <Text className="text-[#878686] font-inter-regular text-[11px]">
          {relativeTime(item.created_at)}
        </Text>
      </Pressable>
    </SwipeableRow>
  );
});

export const ActivityRow = memo(function ActivityRow({
  item,
  onOpen,
  onRemove,
}: {
  item: NotificationItem;
  onOpen: (item: NotificationItem) => void;
  onRemove: (id: string) => void;
}) {
  const alert = isAlertNotification(item.type);

  return (
    <SwipeableRow
      onSwipeLeft={() => onRemove(item.id)}
      onSwipeRight={() => onOpen(item)}
      leftActionLabel="Open"
      rightActionLabel="Delete"
    >
      <Pressable
        onPress={() => onOpen(item)}
        className="flex-row items-center rounded-[8px] px-4 py-4"
        style={{
          backgroundColor: alert ? '#FFF8F5' : '#FFFFFF',
          borderWidth: alert ? 1 : 0,
          borderColor: '#E30404',
        }}
      >
        <ActivityAlertIcon
          color={alert ? '#E30404' : '#113E55'}
          circleColor={alert ? '#FFF0EC' : '#CEE5ED'}
        />

        <View className="flex-1 px-3">
          <Text
            className="text-[#0A1F29] text-sm"
            style={{ fontFamily: item.is_read ? 'Inter_18pt-Light' : 'Inter_18pt-SemiBold' }}
            numberOfLines={1}
          >
            {item.title}
          </Text>
        </View>

        <Text className="text-[#878686] font-inter-regular text-[11px]">
          {relativeTime(item.created_at)}
        </Text>
      </Pressable>
    </SwipeableRow>
  );
});
