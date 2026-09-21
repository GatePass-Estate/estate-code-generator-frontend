import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { ActivityAlertIcon } from '@/src/assets/svgs';
import { isAlertNotification } from '@/src/lib/broadcastStyle';
import { formatFullTimestamp, metadataRows } from '@/src/lib/notificationDetail';
import type { NotificationItem } from '@/src/types/notification';

/**
 * Detail view for a single activity item.
 *
 * The list row only shows a title, so this surfaces the full body, the exact
 * timestamp, and whatever metadata the backend attached (device and IP for a
 * login alert, for example). Types that carry no metadata simply show the body.
 */
export default function ActivityDetailModal({
  activity,
  onClose,
}: {
  activity: NotificationItem | null;
  onClose: () => void;
}) {
  if (!activity) return null;

  const alert = isAlertNotification(activity.type);
  const rows = metadataRows(activity.metadata);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/50 items-center justify-center px-5" onPress={onClose}>
        {/* Swallow taps inside the card so only the backdrop closes it. */}
        <Pressable className="w-full rounded-[24px] bg-white px-5 py-6" onPress={() => {}}>
          <View className="flex-row items-center gap-3">
            <ActivityAlertIcon
              color={alert ? '#E30404' : '#113E55'}
              circleColor={alert ? '#FFF0EC' : '#CEE5ED'}
              size={28}
            />
            <Text className="flex-1 text-[#0A1F29] font-ubuntu-semibold text-lg">
              {activity.title}
            </Text>
          </View>

          <Text className="text-[#878686] font-inter-regular text-[11px] mt-2">
            {formatFullTimestamp(activity.created_at)}
          </Text>

          <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
            <Text className="text-[#0A1F29] font-inter-light text-sm leading-6 mt-4">
              {activity.body}
            </Text>

            {rows.length > 0 && (
              <View className="mt-5 rounded-[8px] bg-[#F6F7F7] px-4 py-3">
                {rows.map((row) => (
                  <View key={row.label} className="flex-row justify-between py-1.5">
                    <Text className="text-[#878686] font-inter-regular text-[11px]">
                      {row.label}
                    </Text>
                    <Text
                      className="text-[#0A1F29] font-inter-regular text-[11px] flex-1 text-right ml-4"
                      numberOfLines={2}
                    >
                      {row.value}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          <Pressable
            onPress={onClose}
            className="bg-primary rounded-[24px] h-11 items-center justify-center mt-6"
          >
            <Text className="text-[#F6F7F7] font-ubuntu-semibold text-sm">Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
