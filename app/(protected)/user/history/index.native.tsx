import { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  AppState,
  type AppStateStatus,
} from 'react-native';
import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '@/src/components/mobile/ScreenHeader';
import { ChevronRightIcon, HistoryRefreshIcon } from '@/src/assets/svgs';
import { getMyVisitorAccessLogs } from '@/src/lib/api/accessLogs';
import { getUpcomingCodes } from '@/src/lib/api/codes';
import { useUserStore } from '@/src/lib/stores/userStore';
import { VisitorLogEntry } from '@/src/types/accessLogs';
import { Codes } from '@/src/types/codes';
import {
  formatPastHistoryVisitDate,
  formatUpcomingInviteCardDate,
  groupLogsByMonth,
  parseLogDate,
} from '@/src/lib/helpers';
import { sharedStyles, TAB_BAR_BASE_HEIGHT } from '@/src/theme/styles';

type HistoryMode = 'past' | 'upcoming';

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

function HistoryModeTabs({
  mode,
  onChange,
}: {
  mode: HistoryMode;
  onChange: (mode: HistoryMode) => void;
}) {
  return (
    <View
      className="self-start flex-row"
      style={{
        borderRadius: 999,
        backgroundColor: '#EFF1F1',
        overflow: 'hidden',
      }}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        style={{
          width: 119,
          paddingVertical: 13,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: mode === 'past' ? '#CEE5ED' : 'transparent',
        }}
        onPress={() => onChange('past')}
      >
        <Text
          className={`font-inter-regular text-[11px] ${
            mode === 'past' ? 'text-[#113E55]' : 'text-[#6C6C6C]'
          }`}
        >
          Past
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        activeOpacity={0.8}
        style={{
          width: 119,
          paddingVertical: 13,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: mode === 'upcoming' ? '#CEE5ED' : 'transparent',
        }}
        onPress={() => onChange('upcoming')}
      >
        <Text
          className={`font-inter-regular text-[11px] ${
            mode === 'upcoming' ? 'text-[#113E55]' : 'text-[#6C6C6C]'
          }`}
        >
          Upcoming
        </Text>
      </TouchableOpacity>
    </View>
  );
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
        <Text className="font-inter-regular text-[11.2px] text-[#878686]">
          {formatPastHistoryVisitDate(entry.visit_time)}
        </Text>
        <Text className="text-sm font-inter-light text-[#0A1F29]">{entry.visitor_fullname}</Text>
        <Text className="text-[11.2px] font-inter-regular capitalize text-[#878686]">
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
  const { user_id } = useUserStore();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [mode, setMode] = useState<HistoryMode>(() => resolveHistoryMode(params.tab));
  const [logs, setLogs] = useState<VisitorLogEntry[]>([]);
  const [upcomingCodes, setUpcomingCodes] = useState<Codes[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pastError, setPastError] = useState<string | null>(null);
  const [upcomingError, setUpcomingError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  const fetchHistory = useCallback(
    async (opts?: { silent?: boolean; pull?: boolean }) => {
      if (!user_id) {
        setLoading(false);
        setRefreshing(false);
        setPastError('User not found.');
        setUpcomingError('User not found.');
        return;
      }

      if (opts?.pull) {
        setRefreshing(true);
      } else if (!opts?.silent) {
        setLoading(true);
      }

      setPastError(null);
      setUpcomingError(null);

      const [pastResult, upcomingResult] = await Promise.allSettled([
        getMyVisitorAccessLogs({ page: 1, limit: 50 }),
        getUpcomingCodes(user_id),
      ]);

      if (pastResult.status === 'fulfilled') {
        setLogs(pastResult.value.items ?? []);
      } else {
        setLogs([]);
        setPastError(pastResult.reason?.message?.trim() || 'Could not load past history.');
      }

      if (upcomingResult.status === 'fulfilled') {
        setUpcomingCodes(upcomingResult.value.items ?? []);
      } else {
        setUpcomingCodes([]);
        setUpcomingError(
          upcomingResult.reason?.message?.trim() || 'Could not load upcoming invites.'
        );
      }

      hasLoadedRef.current = true;
      setLoading(false);
      setRefreshing(false);
    },
    [user_id]
  );

  useFocusEffect(
    useCallback(() => {
      const nextMode = resolveHistoryMode(params.tab);
      setMode(nextMode);
      void fetchHistory({ silent: hasLoadedRef.current });

      // If you're already on History and return from Postman/background, focus won't
      // re-run — refresh when the app becomes active again.
      let previousState = AppState.currentState;
      const onAppStateChange = (nextState: AppStateStatus) => {
        if (previousState.match(/inactive|background/) && nextState === 'active') {
          void fetchHistory({ silent: true });
        }
        previousState = nextState;
      };
      const subscription = AppState.addEventListener('change', onAppStateChange);

      return () => subscription.remove();
    }, [fetchHistory, params.tab])
  );

  const handleModeChange = useCallback(
    (nextMode: HistoryMode) => {
      setMode(nextMode);
      if (nextMode === 'upcoming') {
        void fetchHistory({ silent: true });
      }
    },
    [fetchHistory]
  );

  const pastLogs = useMemo(
    () =>
      dedupeByCode(logs).sort(
        (a, b) => parseLogDate(b.visit_time).getTime() - parseLogDate(a.visit_time).getTime()
      ),
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
    () => groupLogsByMonth(pastLogs, (log) => log.visit_time, { utc: true }),
    [pastLogs]
  );

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

  return (
    <SafeAreaView
      style={[sharedStyles.container, sharedStyles.modalContainer, { backgroundColor: '#F6F7F7' }]}
      edges={['top']}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <ScreenHeader title="History" containerClassName="mt-[29px]" />

      <View style={{ flex: 1, paddingTop: 8 }}>
        <HistoryModeTabs mode={mode} onChange={handleModeChange} />

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#113E55" />
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              flexGrow: 1,
              paddingTop: mode === 'upcoming' ? 35 : 31,
              paddingBottom: TAB_BAR_BASE_HEIGHT + 40,
              gap: 38,
            }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => void fetchHistory({ pull: true })}
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
                groupedPast.map((group) => (
                  <View key={group.label}>
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
                ))
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
