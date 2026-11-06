import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import ActivityIcon from '@/src/components/common/ActivityIcon';
import {
  ANOMALY_NOTIFICATION_TYPE,
  anomalyRoute,
  formatFullTimestamp,
  metadataRows,
} from '@/src/lib/notificationDetail';
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

  const rows = metadataRows(activity.metadata);
  const isAnomaly = activity.type === ANOMALY_NOTIFICATION_TYPE;

  const viewAnomaly = () => {
    const route = anomalyRoute(activity.metadata);
    onClose();
    router.push(route);
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/50 items-center justify-center px-5" onPress={onClose}>
        {/* Swallow taps inside the card so only the backdrop closes it. */}
        <Pressable className="w-full rounded-[24px] bg-white px-5 py-6" onPress={() => {}}>
          <View className="flex-row items-center gap-3">
            <ActivityIcon type={activity.type} size={22} />
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

          {isAnomaly ? (
            <>
              <Pressable
                onPress={viewAnomaly}
                className="bg-primary rounded-[24px] h-11 items-center justify-center mt-6"
              >
                <Text className="text-[#F6F7F7] font-ubuntu-semibold text-sm">View anomaly</Text>
              </Pressable>
              <Pressable
                onPress={onClose}
                className="rounded-[24px] h-11 items-center justify-center mt-2"
              >
                <Text className="text-primary font-ubuntu-semibold text-sm">Close</Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={onClose}
              className="bg-primary rounded-[24px] h-11 items-center justify-center mt-6"
            >
              <Text className="text-[#F6F7F7] font-ubuntu-semibold text-sm">Close</Text>
            </Pressable>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
