import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '@/src/components/mobile/ScreenHeader';
import { ChevronRightIcon, HistoryRefreshIcon } from '@/src/assets/svgs';
import { getMyResidentAccessLogs } from '@/src/lib/api/accessLogs';
import { generateCode, getAllCodes } from '@/src/lib/api/codes';
import { useUserStore } from '@/src/lib/stores/userStore';
import { ResidentLogEntry } from '@/src/types/accessLogs';
import { Codes } from '@/src/types/codes';
import { formatAccessCodeWithSpace, formatDateWithOrdinal } from '@/src/lib/helpers';
import { sharedStyles, TAB_BAR_BASE_HEIGHT } from '@/src/theme/styles';

type HistoryMode = 'past' | 'upcoming';

const capitalizeWords = (value: string) =>
  value
    ? value
        .split(' ')
        .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ''))
        .join(' ')
    : '';

const parseLogDate = (value: string) => {
  const iso = value.replace(' ', 'T').replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
  return new Date(iso);
};

const formatUpcomingDate = (value?: string | null) => {
  if (!value) return 'Scheduled';
  const date = parseLogDate(value);
  if (Number.isNaN(date.getTime())) return value;
  const day = date.getDate();
  const month = date.toLocaleString('en-GB', { month: 'long' });
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${hours}:${minutes}`;
};

/** Keep the latest access event per hashed code. */
function dedupeByCode(entries: ResidentLogEntry[]) {
  const byCode = new Map<string, ResidentLogEntry>();

  entries.forEach((entry) => {
    const existing = byCode.get(entry.hashed_code);
    if (
      !existing ||
      parseLogDate(entry.access_time).getTime() > parseLogDate(existing.access_time).getTime()
    ) {
      byCode.set(entry.hashed_code, entry);
    }
  });

  return Array.from(byCode.values());
}

const groupLogsByMonth = (logs: ResidentLogEntry[]) => {
  const groups = new Map<string, ResidentLogEntry[]>();

  logs.forEach((log) => {
    const date = parseLogDate(log.access_time);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const existing = groups.get(key) ?? [];
    existing.push(log);
    groups.set(key, existing);
  });

  return Array.from(groups.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, items]) => {
      const [year, month] = key.split('-').map(Number);
      const label = new Date(year, month, 1)
        .toLocaleString('en-US', { month: 'long' })
        .toUpperCase();

      return {
        label,
        items: items.sort(
          (a, b) => parseLogDate(b.access_time).getTime() - parseLogDate(a.access_time).getTime()
        ),
      };
    });
};

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

function openPastDetail(entry: ResidentLogEntry) {
  router.push({
    pathname: '/user/history/[codeId]',
    params: {
      codeId: entry.hashed_code,
      name: capitalizeWords(entry.full_name?.trim() || 'Resident'),
      category: 'Resident',
    },
  });
}

function openUpcomingInvite(entry: Codes) {
  router.push({
    pathname: '/user/history/invite/[codeId]',
    params: {
      codeId: entry.hashed_code,
      visitorName: entry.visitor_fullname?.trim() || 'Guest',
      relationship: entry.relationship_with_resident || 'other',
      periodStart: entry.validity_period?.start || entry.valid_until || '',
      periodEnd: entry.validity_period?.end || entry.valid_until || '',
      windowStart: entry.validity_window?.start || '',
      windowEnd: entry.validity_window?.end || '',
    },
  });
}

function PastHistoryCard({
  entry,
  regenerating,
  onRefresh,
  onPress,
}: {
  entry: ResidentLogEntry;
  regenerating: boolean;
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
          {formatDateWithOrdinal(parseLogDate(entry.access_time))}
        </Text>
        <Text className="text-sm font-inter-light text-[#0A1F29] leading-[17px]">
          {capitalizeWords(entry.full_name?.trim() || 'Resident')}
        </Text>
        <Text className="text-[11.2px] font-inter-regular text-[#878686]">Resident</Text>
      </View>

      <Pressable
        onPress={onRefresh}
        disabled={regenerating}
        hitSlop={8}
        className="h-8 w-8 items-center justify-center"
        style={{ opacity: regenerating ? 0.5 : 1 }}
      >
        {regenerating ? (
          <ActivityIndicator size="small" color="#113E55" />
        ) : (
          <HistoryRefreshIcon width={24} height={24} />
        )}
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
      <View className="flex-1 gap-0.5 ">
        <Text className="font-inter-regular text-[9px] text-[#878686] tracking-[-0.2px]">
          {formatUpcomingDate(scheduleDate)}
        </Text>
        <Text className=" text-sm font-inter-light text-[#0A1F29] leading-[17px]">
          {capitalizeWords(entry.visitor_fullname?.trim() || 'Guest')}
        </Text>
        <Text className=" text-xs font-inter-regular capitalize text-[#878686]">
          {entry.relationship_with_resident || formatAccessCodeWithSpace(entry.hashed_code)}
        </Text>
      </View>

      <ChevronRightIcon width={20} height={20} />
    </Pressable>
  );
}

export default function HistoryTabScreen() {
  const { user_id, estate_id } = useUserStore();
  const [mode, setMode] = useState<HistoryMode>('past');
  const [logs, setLogs] = useState<ResidentLogEntry[]>([]);
  const [upcomingCodes, setUpcomingCodes] = useState<Codes[]>([]);
  const [loading, setLoading] = useState(true);
  const [pastError, setPastError] = useState<string | null>(null);
  const [upcomingError, setUpcomingError] = useState<string | null>(null);
  const [regeneratingCode, setRegeneratingCode] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!user_id) {
      setLoading(false);
      setPastError('User not found.');
      setUpcomingError('User not found.');
      return;
    }

    setLoading(true);
    setPastError(null);
    setUpcomingError(null);

    const [pastResult, upcomingResult] = await Promise.allSettled([
      getMyResidentAccessLogs({ page: 1, limit: 50 }),
      getAllCodes(user_id),
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

    setLoading(false);
  }, [user_id]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const uniqueLogs = useMemo(() => dedupeByCode(logs), [logs]);

  const pastLogs = useMemo(
    () =>
      uniqueLogs
        .filter((entry) => entry.code_deleted)
        .sort(
          (a, b) => parseLogDate(b.access_time).getTime() - parseLogDate(a.access_time).getTime()
        ),
    [uniqueLogs]
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

  const groupedPast = useMemo(() => groupLogsByMonth(pastLogs), [pastLogs]);

  const handleRefresh = useCallback(
    async (entry: ResidentLogEntry) => {
      if (!user_id) return;

      setRegeneratingCode(entry.hashed_code);
      try {
        await generateCode({ user_id, estate_id: estate_id ?? entry.estate_id ?? '' }, 'resident');
        await fetchHistory();
        Alert.alert('Code regenerated', 'Your new access code is ready.', [{ text: 'OK' }]);
      } catch {
        Alert.alert('Could not regenerate code', 'Please try again later.');
      } finally {
        setRegeneratingCode(null);
      }
    },
    [estate_id, fetchHistory, user_id]
  );

  return (
    <SafeAreaView
      style={[sharedStyles.container, sharedStyles.modalContainer, { backgroundColor: '#F6F7F7' }]}
      edges={['top']}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <ScreenHeader title="History" containerClassName="mt-[29px]" />

      <View style={{ flex: 1, paddingTop: 8 }}>
        <HistoryModeTabs mode={mode} onChange={setMode} />

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
                          regenerating={regeneratingCode === entry.hashed_code}
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
