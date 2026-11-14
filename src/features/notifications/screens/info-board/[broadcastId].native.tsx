import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { CircleLoader } from '@/src/shared/components/feedback/ScreenLoading';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import Back from '@/src/shared/components/navigation/Back';
import { sharedStyles } from '@/src/shared/theme/styles';
import { errorMessage as thrownMessage } from '@/src/shared/services/api/errors';
import { getBroadcast, markBroadcastRead } from '@/src/features/notifications/services/broadcast';
import { useNotificationStore } from '@/src/features/notifications/store/notificationStore';
import { useUserStore } from '@/src/store/userStore';
import {
  addLocallyReadBroadcasts,
  markBroadcastOpened,
} from '@/src/features/notifications/utils/readBroadcasts';
import { formatSentDate } from '@/src/features/notifications/utils/broadcastStyle';
import type { BroadcastItem } from '@/src/features/notifications/types/broadcast';

export default function BroadcastDetailScreen() {
  const { broadcastId } = useLocalSearchParams<{ broadcastId?: string }>();
  const refreshCounts = useNotificationStore((state) => state.refreshCounts);
  const userId = useUserStore((state) => state.user_id);

  const [broadcast, setBroadcast] = useState<BroadcastItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const load = useCallback(async () => {
    if (!broadcastId) return;

    setLoading(true);
    setErrorMessage('');
    try {
      const item = await getBroadcast(broadcastId);
      setBroadcast(item);

      // Opening the message counts as reading it; the list may have navigated
      // here without marking it (e.g. a deep link).
      if (!item.is_read) {
        // Recorded locally too: the list endpoint under-reports is_read.
        void addLocallyReadBroadcasts(userId, broadcastId);

        try {
          await markBroadcastRead(broadcastId);
          void refreshCounts();
        } catch {
          // Reading is best-effort — never block showing the message.
        }
      }
    } catch (error: unknown) {
      setErrorMessage(thrownMessage(error) || 'Could not load this message.');
    } finally {
      setLoading(false);
    }
  }, [broadcastId, refreshCounts, userId]);

  // Before the fetch, so the popup never shows this message over its own page.
  useEffect(() => {
    if (broadcastId) markBroadcastOpened(broadcastId);
  }, [broadcastId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView
      style={[sharedStyles.container, sharedStyles.modalContainer, { backgroundColor: '#F6F7F7' }]}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <Back type="short-arrow" showText={false} showBorder />

      {loading ? (
        <View className="items-center py-14">
          <CircleLoader size={32} />
        </View>
      ) : errorMessage ? (
        <View className="items-center py-14">
          <Text className="text-danger font-inter-regular text-sm text-center mb-4">
            {errorMessage}
          </Text>
          <Pressable onPress={load} className="px-5 py-3 rounded-[24px] bg-primary">
            <Text className="text-white font-ubuntu-semibold text-sm">Try again</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <Text className="mt-3 font-ubuntu-medium text-primary" style={{ fontSize: 27 }}>
            {broadcast?.title}
          </Text>
          <Text className="text-primary font-inter-light text-sm mt-1">
            Sent: {formatSentDate(broadcast?.created_at)}
          </Text>

          <ScrollView
            className="mt-5 mb-6"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 12 }}
          >
            <View className="bg-white rounded-[8px] px-5 py-7">
              <Text className="text-[#0A1F29] font-inter-light text-sm leading-6">
                {broadcast?.message}
              </Text>
            </View>

            {/* {!!broadcast?.sender_name && (
              <Text className="text-[#878686] font-inter-regular text-[11px] mt-4">
                From {broadcast.sender_name}
              </Text>
            )} */}
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}
