import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { CircleLoader } from '@/src/shared/components/feedback/ScreenLoading';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import ScreenHeader from '@/src/shared/components/layout/ScreenHeader';
import InfoBoardTabs from '@/src/features/notifications/components/InfoBoardTabs';
import ActivityDetailModal from '@/src/features/notifications/components/ActivityDetailModal';
import ConfirmSheet from '@/src/features/notifications/components/ConfirmSheet';
import { ActivityRow, BroadcastRow } from '@/src/features/notifications/components/InfoBoardRows';
import { sharedStyles } from '@/src/shared/theme/styles';
import { useInfoBoard } from '@/src/features/notifications/hooks/useInfoBoard';
import { useNotificationStore } from '@/src/features/notifications/store/notificationStore';
import type { InfoBoardTab } from '@/src/features/notifications/hooks/useInfoBoard';
import type { NotificationItem } from '@/src/features/notifications/types/notification';

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
  // Set by a push-notification tap: which tab to land on, and which activity
  // to open once the list has loaded.
  const params = useLocalSearchParams<{ tab?: string; notificationId?: string }>();
  const requestedTab: InfoBoardTab | undefined =
    params.tab === 'activities' || params.tab === 'message' ? params.tab : undefined;

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
    activitiesLoading,
  } = useInfoBoard(requestedTab);

  const broadcastUnread = useNotificationStore((state) => state.broadcastUnread);
  const activityUnread = useNotificationStore((state) => state.activityUnread);

  const [selectedActivity, setSelectedActivity] = useState<NotificationItem | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  // A tap on another notification while this screen is already open changes
  // the params in place rather than mounting a fresh screen.
  useEffect(() => {
    if (requestedTab) setTab(requestedTab);
  }, [requestedTab, params.notificationId, setTab]);

  const openActivity = useCallback(
    (item: NotificationItem) => {
      setSelectedActivity(item);
      void readActivity(item.id);
    },
    [readActivity]
  );

  // Open the tapped activity's detail once, as soon as it is in the list. If
  // the screen was already open, the list predates the push, so refetch once.
  const pushTarget = useRef<{ id: string; refetched: boolean; done: boolean } | null>(null);
  useEffect(() => {
    const target = params.notificationId;
    if (!target || activitiesLoading) return;

    if (pushTarget.current?.id !== target) {
      pushTarget.current = { id: target, refetched: false, done: false };
    }
    const state = pushTarget.current;
    if (state.done) return;

    const item = activities.find((activity) => activity.id === target);
    if (item) {
      state.done = true;
      openActivity(item);
    } else if (!state.refetched) {
      state.refetched = true;
      void refresh();
    } else {
      state.done = true;
    }
  }, [params.notificationId, activities, activitiesLoading, openActivity, refresh]);

  const handleConfirmClear = useCallback(async () => {
    await clearCurrentTab();
    setConfirmClear(false);
  }, [clearCurrentTab]);

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

  const isMessages = tab === 'message';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[sharedStyles.container, { backgroundColor: '#F6F7F7' }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ScreenHeader title={isMessages ? 'Info Board' : 'Recent Activity'} showBack />

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
              <CircleLoader size={32} />
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
            onPress={() => setConfirmClear(true)}
            disabled={busy}
            className="bg-primary rounded-[24px] h-11 items-center justify-center mb-6 mt-2"
          >
            <Text className="text-[#F6F7F7] font-ubuntu-semibold text-sm">Clear All</Text>
          </Pressable>
        )}

        {/* Clearing is irreversible, so it always goes through the design's
            "Are you sure?" sheet first. */}
        <ConfirmSheet
          visible={confirmClear}
          message={
            isMessages
              ? 'Confirm if you want to clear all messages.\nThis action is irreversible.'
              : 'Confirm if you want to clear all activities.\nThis action is irreversible.'
          }
          confirmLabel="Delete"
          busy={busy}
          onConfirm={() => void handleConfirmClear()}
          onCancel={() => setConfirmClear(false)}
        />

        <ActivityDetailModal
          activity={selectedActivity}
          onClose={() => setSelectedActivity(null)}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
