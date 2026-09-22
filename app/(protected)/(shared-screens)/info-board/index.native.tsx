import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack, router } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import Back from '@/src/components/mobile/Back';
import InfoBoardTabs from '@/src/components/mobile/InfoBoardTabs';
import ActivityDetailModal from '@/src/components/mobile/ActivityDetailModal';
import { ActivityRow, BroadcastRow } from '@/src/components/mobile/InfoBoardRows';
import { sharedStyles } from '@/src/theme/styles';
import { useInfoBoard } from '@/src/hooks/useInfoBoard';
import { useNotificationStore } from '@/src/lib/stores/notificationStore';
import type { NotificationItem } from '@/src/types/notification';

/** Keeps virtualisation tight so switching tabs never mounts a long list. */
const LIST_TUNING = {
  initialNumToRender: 8,
  maxToRenderPerBatch: 8,
  windowSize: 7,
  removeClippedSubviews: true,
};

function EmptyState({ text }: { text: string }) {
  return (
    <Text className="text-[#878686] font-inter-regular text-sm text-center py-10">{text}</Text>
  );
}

export default function InfoBoardScreen() {
  const {
    tab,
    setTab,
    broadcasts,
    activities,
    loading,
    refreshing,
    refresh,
    errorMessage,
    busy,
    readBroadcast,
    removeBroadcast,
    readActivity,
    removeActivity,
    clearCurrentTab,
    hasItems,
  } = useInfoBoard();

  const broadcastUnread = useNotificationStore((state) => state.broadcastUnread);
  const activityUnread = useNotificationStore((state) => state.activityUnread);

  const [selectedActivity, setSelectedActivity] = useState<NotificationItem | null>(null);

  const openBroadcast = useCallback(
    (id: string) => {
      void readBroadcast(id);
      router.push(`/info-board/${id}`);
    },
    [readBroadcast]
  );

  const handleRemoveBroadcast = useCallback(
    (id: string) => void removeBroadcast(id),
    [removeBroadcast]
  );
  const handleRemoveActivity = useCallback(
    (id: string) => void removeActivity(id),
    [removeActivity]
  );

  const openActivity = useCallback(
    (item: NotificationItem) => {
      setSelectedActivity(item);
      void readActivity(item.id);
    },
    [readActivity]
  );

  const isMessages = tab === 'message';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView
        style={[
          sharedStyles.container,
          sharedStyles.modalContainer,
          { backgroundColor: '#F6F7F7' },
        ]}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <Back type="short-arrow" showText={false} showBorder />

        <Text className="text-primary font-ubuntu-medium mt-[18px]" style={{ fontSize: 27 }}>
          {isMessages ? 'Info Board' : 'Recent Activity'}
        </Text>

        <InfoBoardTabs
          tab={tab}
          onChange={setTab}
          broadcastUnread={broadcastUnread}
          activityUnread={activityUnread}
        />

        {!!errorMessage && (
          <Text className="text-danger font-inter-regular text-xs mt-4">{errorMessage}</Text>
        )}

        {/*
          Keyed on the tab so React swaps the list outright instead of diffing
          two different row types, and `FadeIn` animates only the incoming
          content. The switch itself is synchronous — nothing awaits data.
        */}
        <Animated.View key={tab} entering={FadeIn.duration(160)} style={{ flex: 1 }}>
          {loading ? (
            <View className="items-center py-14">
              <ActivityIndicator color="#113E55" />
            </View>
          ) : isMessages ? (
            <FlatList
              {...LIST_TUNING}
              className="mt-6"
              data={broadcasts}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#113E55" />
              }
              ListEmptyComponent={<EmptyState text="No messages from your estate yet." />}
              renderItem={({ item }) => (
                <BroadcastRow item={item} onOpen={openBroadcast} onRemove={handleRemoveBroadcast} />
              )}
            />
          ) : (
            <FlatList
              {...LIST_TUNING}
              className="mt-6"
              data={activities}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#113E55" />
              }
              ListEmptyComponent={<EmptyState text="Nothing has happened on your account yet." />}
              renderItem={({ item }) => (
                <ActivityRow item={item} onOpen={openActivity} onRemove={handleRemoveActivity} />
              )}
            />
          )}
        </Animated.View>

        {hasItems && (
          <Pressable
            onPress={() => void clearCurrentTab()}
            disabled={busy}
            className="bg-primary rounded-[24px] h-12 items-center justify-center mb-6 mt-2"
            style={{ opacity: busy ? 0.7 : 1 }}
          >
            {busy ? (
              <ActivityIndicator color="#F6F7F7" />
            ) : (
              <Text className="text-[#F6F7F7] font-ubuntu-semibold text-sm">Clear All</Text>
            )}
          </Pressable>
        )}

        <ActivityDetailModal
          activity={selectedActivity}
          onClose={() => setSelectedActivity(null)}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
