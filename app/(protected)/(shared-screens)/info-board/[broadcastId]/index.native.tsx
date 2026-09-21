import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import Back from '@/src/components/mobile/Back';
import { sharedStyles } from '@/src/theme/styles';
import { getBroadcast, markBroadcastRead } from '@/src/lib/api/broadcast';
import { useNotificationStore } from '@/src/lib/stores/notificationStore';
import { formatSentDate } from '@/src/lib/broadcastStyle';
import type { BroadcastItem } from '@/src/types/broadcast';

export default function BroadcastDetailScreen() {
  const { broadcastId } = useLocalSearchParams<{ broadcastId?: string }>();
  const refreshCounts = useNotificationStore((state) => state.refreshCounts);

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
        try {
          await markBroadcastRead(broadcastId);
          void refreshCounts();
        } catch {
          // Reading is best-effort — never block showing the message.
        }
      }
    } catch (error: any) {
      setErrorMessage(error?.message || 'Could not load this message.');
    } finally {
      setLoading(false);
    }
  }, [broadcastId, refreshCounts]);

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
          <ActivityIndicator color="#113E55" />
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
          <Text className="text-primary font-ubuntu-medium mt-[18px]" style={{ fontSize: 27 }}>
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

            {!!broadcast?.sender_name && (
              <Text className="text-[#878686] font-inter-regular text-[11px] mt-4">
                From {broadcast.sender_name}
              </Text>
            )}
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}
