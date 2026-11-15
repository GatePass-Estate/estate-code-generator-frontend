import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { CircleLoader } from '@/src/shared/components/feedback/ScreenLoading';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack, useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import ScreenHeader from '@/src/shared/components/layout/ScreenHeader';
import InfoBoardTabs from '@/src/features/notifications/components/InfoBoardTabs';
import ActivityDetailModal from '@/src/features/notifications/components/ActivityDetailModal';
import ConfirmSheet from '@/src/features/notifications/components/ConfirmSheet';
import { ActivityRow, BroadcastRow } from '@/src/features/notifications/components/InfoBoardRows';
import { sharedStyles } from '@/src/shared/theme/styles';
import { useInfoBoardScreen } from '@/src/features/notifications/hooks/useInfoBoardScreen';
import { requestedInfoBoardTab } from '@/src/features/notifications/utils/pushTarget';

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
  const {
    tab,
    setTab,
    isMessages,
    broadcasts,
    activities,
    loading,
    refreshing,
    refresh,
    errorMessage,
    busy,
    hasItems,
    broadcastUnread,
    activityUnread,
    openBroadcast,
    openActivity,
    handleRemoveBroadcast,
    handleRemoveActivity,
    selectedActivity,
    closeActivity,
    confirmClear,
    setConfirmClear,
    handleConfirmClear,
  } = useInfoBoardScreen({
    requestedTab: requestedInfoBoardTab(params.tab),
    notificationId: params.notificationId,
  });

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

        <ActivityDetailModal activity={selectedActivity} onClose={closeActivity} />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
