import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ScreenLoading, { CircleLoader } from '@/src/shared/components/feedback/ScreenLoading';
import {
  View,
  Text,
  SectionList,
  FlatList,
  Pressable,
  RefreshControl,
  AppState,
  type AppStateStatus,
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
const END_REACHED_THRESHOLD = 0.4;

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

function HistoryCardSeparator() {
  return <View style={{ height: 13 }} />;
}

function PastSectionSeparator({
  leadingItem,
  trailingSection,
}: {
  leadingItem?: unknown;
  trailingSection?: unknown;
}) {
  if (leadingItem == null || trailingSection == null) return null;
  return <View style={{ height: 38 }} />;
}

export default function HistoryTabScreen() {
  const { tabContentPadding } = useAndroidBottomInset();
  const user_id = useUserStore((s) => s.user_id);
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
  const pastSections = useMemo(
    () =>
      groupedPast.map((group, index) => ({
        key: `${group.label}-${index}`,
        title: group.label,
        data: group.items,
      })),
    [groupedPast]
  );

  const loadMorePast = useCallback(() => {
    if (mode === 'past' && hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, mode]);

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

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        void refreshHistory().finally(() => setRefreshing(false));
      }}
      tintColor="#113E55"
      colors={['#113E55']}
    />
  );

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
        ) : mode === 'past' ? (
          <SectionList
            style={{ flex: 1 }}
            sections={pastSections}
            keyExtractor={(entry) => entry.id}
            stickySectionHeadersEnabled={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              flexGrow: 1,
              // Past rows and the shared empty/error offset both start at 31.
              paddingTop: 31,
              paddingBottom: tabContentPadding + 40,
            }}
            onEndReached={loadMorePast}
            onEndReachedThreshold={END_REACHED_THRESHOLD}
            onLayout={(event) => {
              layoutHeightRef.current = event.nativeEvent.layout.height;
              fillViewport();
            }}
            onContentSizeChange={(_width, height) => {
              contentHeightRef.current = height;
              fillViewport();
            }}
            refreshControl={refreshControl}
            renderSectionHeader={({ section }) => (
              <Text className="mb-[18px] px-4 text-xs leading-[14px] font-inter-light text-[#6C6C6C]">
                {section.title}
              </Text>
            )}
            renderItem={({ item }) => (
              <PastHistoryCard
                entry={item}
                onRefresh={() => handleRefresh(item)}
                onPress={() => openPastDetail(item)}
              />
            )}
            ItemSeparatorComponent={HistoryCardSeparator}
            SectionSeparatorComponent={PastSectionSeparator}
            ListEmptyComponent={
              pastError ? (
                <Text className="text-center text-sm font-inter-regular text-[#6C6C6C]">
                  {pastError}
                </Text>
              ) : (
                <Text className="text-center text-sm font-inter-regular text-[#6C6C6C]">
                  No past access history yet.
                </Text>
              )
            }
            ListFooterComponent={
              isFetchingNextPage ? (
                <View style={{ marginTop: 38 }}>
                  <CircleLoader size={32} />
                </View>
              ) : null
            }
          />
        ) : (
          <FlatList
            style={{ flex: 1 }}
            data={sortedUpcoming}
            keyExtractor={(entry) => entry.hashed_code}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              flexGrow: 1,
              // Empty/error copy uses the past list's offset so the two tabs line up.
              paddingTop: showingMessageOnly ? 31 : 35,
              paddingBottom: tabContentPadding + 40,
            }}
            refreshControl={refreshControl}
            renderItem={({ item }) => (
              <UpcomingHistoryCard entry={item} onPress={() => openUpcomingInvite(item)} />
            )}
            ItemSeparatorComponent={HistoryCardSeparator}
            ListEmptyComponent={
              upcomingError ? (
                <Text className="text-center text-sm font-inter-regular text-[#6C6C6C]">
                  {upcomingError}
                </Text>
              ) : (
                <Text className="text-center text-sm font-inter-regular text-[#6C6C6C]">
                  No upcoming invites yet.
                </Text>
              )
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}
