import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ScreenLoading, { CircleLoader } from '@/src/shared/components/feedback/ScreenLoading';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  AppState,
  type AppStateStatus,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '@/src/shared/components/layout/ScreenHeader';
import AnimatedPillTabs from '@/src/shared/components/AnimatedPillTabs';
import { ChevronRightIcon, HistoryRefreshIcon } from '@/src/assets/svgs';
import { useMyVisitorAccessLogsInfinite } from '@/src/features/history/hooks/accessLogs';
import { useUpcomingCodes } from '@/src/features/access-codes/hooks/codes';
import { useUserStore } from '@/src/store/userStore';
import { VisitorLogEntry } from '@/src/features/history/types/accessLogs';
import { Codes } from '@/src/features/access-codes/types/codes';
import {
  compareLogDatesDesc,
  formatPastHistoryVisitDate,
  formatUpcomingInviteCardDate,
  groupLogsByMonth,
  parseLogDate,
} from '@/src/shared/utils/helpers';
import { sharedStyles } from '@/src/shared/theme/styles';
import { useAndroidBottomInset } from '@/src/shared/hooks/useAndroidBottomInset';

type HistoryMode = 'past' | 'upcoming';

/** Visits per page; the list is de-duplicated by code, so older codes arrive on later pages. */
const PAST_PAGE_SIZE = 50;
const END_REACHED_THRESHOLD = 200;

function resolveHistoryMode(tab?: string | string[]): HistoryMode {
  const value = Array.isArray(tab) ? tab[0] : tab;
  return value === 'upcoming' ? 'upcoming' : 'past';
}

/** Keep the latest access event per hashed code. */
function dedupeByCode(entries: VisitorLogEntry[]) {
  const byCode = new Map<string, VisitorLogEntry>();

  entries.forEach((entry) => {
    const existing = byCode.get(entry.hashed_code);
    if (
      !existing ||
      parseLogDate(entry.visit_time).getTime() > parseLogDate(existing.visit_time).getTime()
    ) {
      byCode.set(entry.hashed_code, entry);
    }
  });

  return Array.from(byCode.values());
}

function openPastDetail(entry: VisitorLogEntry) {
  router.push({
    pathname: '/user/history/[codeId]',
    params: {
      codeId: entry.hashed_code,
      name: entry.visitor_fullname,
      category: entry.relationship_with_resident,
    },
  });
}

function openUpcomingInvite(entry: Codes) {
  router.push({
    pathname: '/user/history/invite/[codeId]',
    params: {
      codeId: entry.hashed_code,
      visitorName: entry.visitor_fullname ?? '',
      relationship: entry.relationship_with_resident || 'other',
    },
  });
}

function PastHistoryCard({
  entry,
  onRefresh,
  onPress,
}: {
  entry: VisitorLogEntry;
  onRefresh: () => void;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between rounded-[8px] bg-white p-4"
    >
      <View className="flex-1 gap-0.5 pr-3">
        <Text className="font-inter-regular text-caption text-[#878686]">
          {formatPastHistoryVisitDate(entry.visit_time)}
        </Text>
        <Text className="text-sm font-inter-light text-[#0A1F29]">{entry.visitor_fullname}</Text>
        <Text className="text-caption font-inter-regular capitalize text-[#878686]">
          {entry.relationship_with_resident}
        </Text>
      </View>

      <Pressable onPress={onRefresh} hitSlop={8} className="h-8 w-8 items-center justify-center">
        <HistoryRefreshIcon width={24} height={24} />
      </Pressable>
    </Pressable>
  );
}

function UpcomingHistoryCard({ entry, onPress }: { entry: Codes; onPress: () => void }) {
  const scheduleDate = entry.validity_period?.start || entry.valid_until;

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between rounded-[8px] bg-white p-4"
    >
      <View className="flex-1 gap-0.5">
        <Text className="font-inter-regular text-[9px] leading-[14px] text-[#878686] tracking-[-0.2px]">
          {formatUpcomingInviteCardDate(scheduleDate)}
        </Text>
        <Text className="text-sm font-inter-light text-[#0A1F29] leading-[17px]">
          {entry.visitor_fullname}
        </Text>
        <Text className="text-xs font-inter-regular leading-[14px] capitalize text-[#878686]">
          {entry.relationship_with_resident}
        </Text>
      </View>

      <ChevronRightIcon width={20} height={20} />
    </Pressable>
  );
}

export default function HistoryTabScreen() {
  const { tabContentPadding } = useAndroidBottomInset();
  const { user_id } = useUserStore();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [mode, setMode] = useState<HistoryMode>(() => resolveHistoryMode(params.tab));
  const [refreshing, setRefreshing] = useState(false);
  const pastQuery = useMyVisitorAccessLogsInfinite(PAST_PAGE_SIZE, Boolean(user_id));
  const upcomingQuery = useUpcomingCodes(user_id);
  const logs = useMemo(
    () => (pastQuery.isError ? [] : (pastQuery.data?.pages.flatMap((page) => page.items) ?? [])),
    [pastQuery.isError, pastQuery.data]
  );
  const upcomingCodes = useMemo(
    () => (upcomingQuery.isError ? [] : (upcomingQuery.data?.items ?? [])),
    [upcomingQuery.isError, upcomingQuery.data]
  );
  const loading = Boolean(user_id) && (pastQuery.isLoading || upcomingQuery.isLoading);
  const pastError = !user_id
    ? 'User not found.'
    : pastQuery.isError
      ? pastQuery.error.message?.trim() || 'Could not load past history.'
      : null;
  const upcomingError = !user_id
    ? 'User not found.'
    : upcomingQuery.isError
      ? upcomingQuery.error.message?.trim() || 'Could not load upcoming invites.'
      : null;

  const { refetch: refetchPast, hasNextPage, isFetchingNextPage, fetchNextPage } = pastQuery;
  const { refetch: refetchUpcoming } = upcomingQuery;
  // Read through refs so a query finishing its first load does not re-run the focus effect
  // (which would reset the tab and refetch twice).
  const pastFetchedRef = useRef(pastQuery.isFetched);
  pastFetchedRef.current = pastQuery.isFetched;
  const upcomingFetchedRef = useRef(upcomingQuery.isFetched);
  upcomingFetchedRef.current = upcomingQuery.isFetched;
  const refreshHistory = useCallback(async () => {
    await Promise.all([refetchPast(), refetchUpcoming()]);
  }, [refetchPast, refetchUpcoming]);

  useFocusEffect(
    useCallback(() => {
      const nextMode = resolveHistoryMode(params.tab);
      setMode(nextMode);
      if (pastFetchedRef.current) void refetchPast();
      if (upcomingFetchedRef.current) void refetchUpcoming();

      // If you're already on History and return from Postman/background, focus won't
      // re-run — refresh when the app becomes active again.
      let previousState = AppState.currentState;
      const onAppStateChange = (nextState: AppStateStatus) => {
        if (previousState.match(/inactive|background/) && nextState === 'active') {
          void refreshHistory();
        }
        previousState = nextState;
      };
      const subscription = AppState.addEventListener('change', onAppStateChange);

      return () => subscription.remove();
    }, [refreshHistory, refetchPast, refetchUpcoming, params.tab])
  );

  const handleModeChange = useCallback(
    (nextMode: HistoryMode) => {
      setMode(nextMode);
      if (nextMode === 'upcoming' && upcomingQuery.isFetched) {
        void refetchUpcoming();
      }
    },
    [refetchUpcoming, upcomingQuery.isFetched]
  );

  const pastLogs = useMemo(
    () => dedupeByCode(logs).sort((a, b) => compareLogDatesDesc(a.visit_time, b.visit_time)),
    [logs]
  );

  const sortedUpcoming = useMemo(
    () =>
      [...upcomingCodes].sort((a, b) => {
        const aDate = a.validity_period?.start || a.valid_until || '';
        const bDate = b.validity_period?.start || b.valid_until || '';
        return parseLogDate(aDate).getTime() - parseLogDate(bDate).getTime();
      }),
    [upcomingCodes]
  );

  const groupedPast = useMemo(
    () => groupLogsByMonth(pastLogs, (log) => log.visit_time),
    [pastLogs]
  );

  const loadMorePast = useCallback(() => {
    if (mode === 'past' && hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, mode]);

  const handleScroll = useCallback(
    ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
      if (
        layoutMeasurement.height + contentOffset.y >=
        contentSize.height - END_REACHED_THRESHOLD
      ) {
        loadMorePast();
      }
    },
    [loadMorePast]
  );

  // De-duplicating by code can leave a page too short to scroll; keep loading until it fills.
  const layoutHeightRef = useRef(0);
  const contentHeightRef = useRef(0);
  const fillViewport = useCallback(() => {
    if (layoutHeightRef.current > 0 && contentHeightRef.current <= layoutHeightRef.current) {
      loadMorePast();
    }
  }, [loadMorePast]);
  useEffect(() => {
    fillViewport();
  }, [fillViewport, pastQuery.data]);

  const handleRefresh = useCallback((entry: VisitorLogEntry) => {
    router.push({
      pathname: '/user/history/duration',
      params: {
        visitorName: entry.visitor_fullname || 'Guest',
        relationship: entry.relationship_with_resident || 'other',
        gender: entry.gender || 'prefer_not_to_say',
      },
    });
  }, []);

  const showingMessageOnly =
    mode === 'past'
      ? !!pastError || groupedPast.length === 0
      : !!upcomingError || sortedUpcoming.length === 0;

  return (
    <SafeAreaView style={[sharedStyles.container, { backgroundColor: '#F6F7F7' }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScreenHeader title="History" />

      <View style={{ flex: 1, paddingTop: 8 }}>
        <AnimatedPillTabs
          style={{ alignSelf: 'flex-start' }}
          value={mode}
          onChange={handleModeChange}
          options={[
            { value: 'past', label: 'Past' },
            { value: 'upcoming', label: 'Upcoming' },
          ]}
        />

        {loading ? (
          <ScreenLoading />
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              flexGrow: 1,
              // Lists keep their per-tab offsets; the empty/error message sits at one shared offset so
              // it lines up when switching tabs.
              paddingTop: showingMessageOnly ? 31 : mode === 'upcoming' ? 35 : 31,
              paddingBottom: tabContentPadding + 40,
              gap: 38,
            }}
            showsVerticalScrollIndicator={false}
            onLayout={(event) => {
              layoutHeightRef.current = event.nativeEvent.layout.height;
              fillViewport();
            }}
            onScroll={handleScroll}
            onContentSizeChange={(_width, height) => {
              contentHeightRef.current = height;
              fillViewport();
            }}
            scrollEventThrottle={100}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  void refreshHistory().finally(() => setRefreshing(false));
                }}
                tintColor="#113E55"
                colors={['#113E55']}
              />
            }
          >
            {mode === 'past' ? (
              pastError ? (
                <Text className="text-center text-sm font-inter-regular text-[#6C6C6C]">
                  {pastError}
                </Text>
              ) : groupedPast.length === 0 ? (
                <Text className="text-center text-sm font-inter-regular text-[#6C6C6C]">
                  No past access history yet.
                </Text>
              ) : (
                <>
                  {groupedPast.map((group, index) => (
                    <View key={`${group.label}-${index}`}>
                      <Text className="mb-[18px] px-4 text-xs leading-[14px] font-inter-light text-[#6C6C6C]">
                        {group.label}
                      </Text>
                      <View className="flex-col gap-[13px]">
                        {group.items.map((entry) => (
                          <PastHistoryCard
                            key={entry.id}
                            entry={entry}
                            onRefresh={() => handleRefresh(entry)}
                            onPress={() => openPastDetail(entry)}
                          />
                        ))}
                      </View>
                    </View>
                  ))}
                  {isFetchingNextPage ? <CircleLoader size={32} /> : null}
                </>
              )
            ) : upcomingError ? (
              <Text className="text-center text-sm font-inter-regular text-[#6C6C6C]">
                {upcomingError}
              </Text>
            ) : sortedUpcoming.length === 0 ? (
              <Text className="text-center text-sm font-inter-regular text-[#6C6C6C]">
                No upcoming invites yet.
              </Text>
            ) : (
              <View className="flex-col gap-[13px]">
                {sortedUpcoming.map((entry) => (
                  <UpcomingHistoryCard
                    key={entry.hashed_code}
                    entry={entry}
                    onPress={() => openUpcomingInvite(entry)}
                  />
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
