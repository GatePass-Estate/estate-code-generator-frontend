import { useCallback, useMemo, useState } from 'react';
import ScreenLoading, { CircleLoader } from '@/src/shared/components/feedback/ScreenLoading';
import LoadError from '@/src/shared/components/feedback/LoadError';
import { userFacingError } from '@/src/shared/services/api/errors';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { sharedStyles } from '@/src/shared/theme/styles';
import ScreenHeader from '@/src/shared/components/layout/ScreenHeader';
import AnimatedPillTabs from '@/src/shared/components/AnimatedPillTabs';
import {
  compareLogDatesDesc,
  formatAccessCodeWithSpace,
  formatPastHistoryVisitDate,
  groupLogsByMonth,
} from '@/src/shared/utils/helpers';
import {
  mapResidentLogToSecurityEntry,
  mapVisitorLogToSecurityEntry,
} from '@/src/features/history/utils/accessLogMappers';
import {
  useEstateResidentLogsInfinite,
  useEstateVisitorLogsInfinite,
} from '@/src/features/history/hooks/accessLogs';
import { SecurityHistoryEntry } from '@/src/features/history/types/accessLogs';
import SecurityTabBar from '@/src/features/scanner/components/SecurityTabBar';

type HistoryMode = 'visitor' | 'resident';

const PAGE_SIZE = 20;
const END_REACHED_THRESHOLD = 200;

const capitalizeWords = (value: string) =>
  value
    ? value
        .split(' ')
        .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ''))
        .join(' ')
    : '';

const AccessLogCard = ({
  entry,
  onPress,
}: {
  entry: SecurityHistoryEntry;
  onPress: () => void;
}) => (
  <Pressable onPress={onPress} className="rounded-[8px] bg-white p-4 flex-col ">
    <View className=" flex-row items-start justify-between  mb-2">
      <Text className=" font-inter-regular text-caption text-[#6C6C6C] ">
        {formatPastHistoryVisitDate(entry.timestamp)}
      </Text>
      <Text className=" font-inter-regular text-caption text-[#6C6C6C]">Access Code</Text>
    </View>

    <View className="items-start justify-center h-[17px]">
      <Text className="text-sm font-inter-light text-[#0A1F29] ">
        {capitalizeWords(entry.name)}
      </Text>
    </View>

    <View className=" flex-row items-center justify-between mt-1 ">
      <Text className="text-sm font-inter-light capitalize text-[#6C6C6C]">{entry.category}</Text>
      <Text className="text-sm font-inter-light  text-[#0A1F29]">
        {formatAccessCodeWithSpace(entry.hashed_code)}
      </Text>
    </View>
  </Pressable>
);

export default function AccessLogScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<HistoryMode>('visitor');
  const [refreshing, setRefreshing] = useState(false);
  const visitorLogs = useEstateVisitorLogsInfinite(PAGE_SIZE, mode === 'visitor');
  const residentLogs = useEstateResidentLogsInfinite(PAGE_SIZE, mode === 'resident');
  const activeQuery = mode === 'visitor' ? visitorLogs : residentLogs;
  const logs = useMemo(() => {
    if (mode === 'visitor') {
      if (visitorLogs.isError || !visitorLogs.data) return [];
      return visitorLogs.data.pages
        .flatMap((page) => page.items)
        .map(mapVisitorLogToSecurityEntry)
        .sort((a, b) => compareLogDatesDesc(a.timestamp, b.timestamp));
    }
    if (residentLogs.isError || !residentLogs.data) return [];
    return residentLogs.data.pages
      .flatMap((page) => page.items)
      .map(mapResidentLogToSecurityEntry)
      .sort((a, b) => compareLogDatesDesc(a.timestamp, b.timestamp));
  }, [mode, visitorLogs.data, visitorLogs.isError, residentLogs.data, residentLogs.isError]);
  const loading = activeQuery.isLoading;
  const error = activeQuery.isError
    ? userFacingError(activeQuery.error, 'Could not load access history.')
    : null;
  const { hasNextPage, isFetchingNextPage, fetchNextPage, refetch } = activeQuery;
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);
  const handleScroll = useCallback(
    ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
      if (
        layoutMeasurement.height + contentOffset.y >=
        contentSize.height - END_REACHED_THRESHOLD
      ) {
        loadMore();
      }
    },
    [loadMore]
  );

  const groupedLogs = useMemo(() => groupLogsByMonth(logs, (log) => log.timestamp), [logs]);

  const switchMode = (nextMode: HistoryMode) => {
    if (nextMode === mode) return;
    setMode(nextMode);
  };

  const openTimeline = (entry: SecurityHistoryEntry) => {
    router.push({
      pathname: '/security/history/detail',
      params: {
        name: entry.name,
        category: entry.category,
        hashed_code: entry.hashed_code,
        timestamp: entry.timestamp,
        receiver: entry.receiver,
        user_id: entry.user_id ?? '',
      },
    });
  };

  return (
    <SafeAreaView style={[sharedStyles.container, { backgroundColor: '#F6F7F7' }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScreenHeader title="Access Log" subtitle="View all access code you have approved" />

      <View style={{ flex: 1, paddingTop: 24 }}>
        <AnimatedPillTabs
          style={{ alignSelf: 'center', marginBottom: 17 }}
          options={[
            { value: 'visitor', label: 'Guest History' },
            { value: 'resident', label: 'Resident History' },
          ]}
          value={mode}
          onChange={switchMode}
          width={296}
          activeWidth={148}
        />

        {loading ? (
          <ScreenLoading />
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 0, paddingTop: 20, paddingBottom: 96, gap: 30 }}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={100}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  void refetch().finally(() => setRefreshing(false));
                }}
                tintColor="#113E55"
              />
            }
          >
            {error ? (
              <LoadError message={error} onRetry={() => void refetch()} />
            ) : groupedLogs.length === 0 ? (
              <Text className="px-6 text-center text-sm text-grey">
                {mode === 'resident'
                  ? 'No resident access logs yet.'
                  : 'No guest access logs found.'}
              </Text>
            ) : (
              groupedLogs.map((group) => (
                <View key={group.label}>
                  <Text className="mb-3 px-4 text-sm font-inter-light  text-[#6C6C6C]">
                    {group.label}
                  </Text>
                  <View className="flex-col gap-2">
                    {group.items.map((entry) => (
                      <AccessLogCard
                        key={entry.id}
                        entry={entry}
                        onPress={() => openTimeline(entry)}
                      />
                    ))}
                  </View>
                </View>
              ))
            )}
            {isFetchingNextPage ? <CircleLoader size={32} style={{ marginTop: 8 }} /> : null}
          </ScrollView>
        )}
      </View>
      <SecurityTabBar activeTab="history" />
    </SafeAreaView>
  );
}
