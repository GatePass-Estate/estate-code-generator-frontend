import { useCallback } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack, router } from 'expo-router';
import Back from '@/src/components/mobile/Back';
import SwipeableRow from '@/src/components/mobile/SwipeableRow';
import { sharedStyles } from '@/src/theme/styles';
import { ActivityAlertIcon, PriorityAlarmIcon } from '@/src/assets/svgs';
import { useInfoBoard, type InfoBoardTab } from '@/src/hooks/useInfoBoard';
import { useNotificationStore } from '@/src/lib/stores/notificationStore';
import { isAlertNotification, priorityStyle, relativeTime } from '@/src/lib/broadcastStyle';

function TabSwitch({
  tab,
  onChange,
  broadcastUnread,
  activityUnread,
}: {
  tab: InfoBoardTab;
  onChange: (next: InfoBoardTab) => void;
  broadcastUnread: number;
  activityUnread: number;
}) {
  return (
    <View className="flex-row self-start rounded-[24px] bg-[#EFF1F1] p-0 mt-5">
      {(['message', 'activities'] as InfoBoardTab[]).map((value) => {
        const active = tab === value;
        const unread = value === 'message' ? broadcastUnread : activityUnread;
        return (
          <Pressable
            key={value}
            onPress={() => onChange(value)}
            className="h-10 w-[119px] items-center justify-center rounded-[24px]"
            style={{ backgroundColor: active ? '#CEE5ED' : 'transparent' }}
          >
            <Text
              className="font-inter-regular text-[11px]"
              style={{ color: active ? '#113E55' : '#878686' }}
            >
              {value === 'message' ? 'Message' : 'Activities'}
            </Text>
            {/* The dot marks unread on the tab you are not currently viewing. */}
            {!active && unread > 0 && (
              <View className="absolute right-3 top-2 h-[9px] w-[9px] rounded-full bg-[#E30404]" />
            )}
          </Pressable>
        );
      })}
    </View>
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

  const openBroadcast = useCallback(
    (id: string) => {
      void readBroadcast(id);
      router.push(`/info-board/${id}`);
    },
    [readBroadcast]
  );

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
          {tab === 'message' ? 'Info Board' : 'Recent Activity'}
        </Text>

        <TabSwitch
          tab={tab}
          onChange={setTab}
          broadcastUnread={broadcastUnread}
          activityUnread={activityUnread}
        />

        {!!errorMessage && (
          <Text className="text-danger font-inter-regular text-xs mt-4">{errorMessage}</Text>
        )}

        {loading ? (
          <View className="items-center py-14">
            <ActivityIndicator color="#113E55" />
          </View>
        ) : (
          <ScrollView
            className="mt-6"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#113E55" />
            }
          >
            {tab === 'message' ? (
              broadcasts.length === 0 ? (
                <Text className="text-[#878686] font-inter-regular text-sm text-center py-10">
                  No messages from your estate yet.
                </Text>
              ) : (
                broadcasts.map((item) => {
                  const style = priorityStyle(item.priority);
                  return (
                    <SwipeableRow
                      key={item.id}
                      onSwipeLeft={() => void removeBroadcast(item.id)}
                      onSwipeRight={() => openBroadcast(item.id)}
                      leftActionLabel="Open"
                      rightActionLabel="Delete"
                    >
                      <Pressable
                        onPress={() => openBroadcast(item.id)}
                        className="flex-row items-center rounded-[8px] border px-4 py-3"
                        style={{ backgroundColor: style.background, borderColor: style.border }}
                      >
                        <PriorityAlarmIcon color={style.icon} circleColor={style.circle} />

                        <View className="flex-1 px-3">
                          <Text
                            className="text-[#0A1F29] text-sm"
                            style={{
                              fontFamily: item.is_read ? 'Inter_18pt-Light' : 'Inter_18pt-SemiBold',
                            }}
                            numberOfLines={1}
                          >
                            {item.title}
                          </Text>
                          <Text
                            className="text-[#878686] font-inter-regular text-[11px] mt-0.5"
                            numberOfLines={1}
                          >
                            {item.message}
                          </Text>
                        </View>

                        <Text className="text-[#878686] font-inter-regular text-[11px]">
                          {relativeTime(item.created_at)}
                        </Text>
                      </Pressable>
                    </SwipeableRow>
                  );
                })
              )
            ) : activities.length === 0 ? (
              <Text className="text-[#878686] font-inter-regular text-sm text-center py-10">
                Nothing has happened on your account yet.
              </Text>
            ) : (
              activities.map((item) => {
                const alert = isAlertNotification(item.type);
                return (
                  <SwipeableRow
                    key={item.id}
                    onSwipeLeft={() => void removeActivity(item.id)}
                    onSwipeRight={() => void readActivity(item.id)}
                    leftActionLabel="Mark read"
                    rightActionLabel="Delete"
                  >
                    <Pressable
                      onPress={() => void readActivity(item.id)}
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
                          style={{
                            fontFamily: item.is_read ? 'Inter_18pt-Light' : 'Inter_18pt-SemiBold',
                          }}
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
              })
            )}
          </ScrollView>
        )}

        {hasItems && (
          <Pressable
            onPress={() => void clearCurrentTab()}
            disabled={busy}
            className="bg-primary rounded-[24px] h-11 items-center justify-center mb-6 mt-2"
            style={{ opacity: busy ? 0.7 : 1 }}
          >
            {busy ? (
              <ActivityIndicator color="#F6F7F7" />
            ) : (
              <Text className="text-[#F6F7F7] font-ubuntu-semibold text-sm">Clear All</Text>
            )}
          </Pressable>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
