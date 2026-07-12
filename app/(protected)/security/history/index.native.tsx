import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useNavigation, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { sharedStyles } from '@/src/theme/styles';
import ScreenHeader from '@/src/components/mobile/ScreenHeader';
import { formatDateWithOrdinal } from '@/src/lib/helpers';
import {
  mapResidentLogToSecurityEntry,
  mapVisitorLogToSecurityEntry,
} from '@/src/lib/accessLogMappers';
import { getEstateResidentLogs, getEstateVisitorLogs } from '@/src/lib/api/accessLogs';
import { SecurityHistoryEntry } from '@/src/types/accessLogs';

type HistoryMode = 'visitor' | 'resident';

const capitalizeWords = (value: string) =>
  value
    ? value
        .split(' ')
        .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ''))
        .join(' ')
    : '';

const formatAccessCode = (code: string) => {
  const normalized = code.replace(/\s+/g, '').toUpperCase();
  return `${normalized.slice(0, 3)} ${normalized.slice(3)}`;
};

const parseLogDate = (value: string) => {
  const iso = value.replace(' ', 'T').replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
  return new Date(iso);
};

const groupLogsByMonth = (logs: SecurityHistoryEntry[]) => {
  const groups = new Map<string, SecurityHistoryEntry[]>();

  logs.forEach((log) => {
    const date = parseLogDate(log.timestamp);
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
          (a, b) => parseLogDate(b.timestamp).getTime() - parseLogDate(a.timestamp).getTime()
        ),
      };
    });
};

const AccessLogCard = ({
  entry,
  onPress,
}: {
  entry: SecurityHistoryEntry;
  onPress: () => void;
}) => (
  <Pressable onPress={onPress} className="rounded-[8px] bg-white p-4 flex-col ">
    <View className=" flex-row items-start justify-between  mb-2">
      <Text className=" font-inter-regular text-[11px] text-[#6C6C6C] ">
        {formatDateWithOrdinal(parseLogDate(entry.timestamp))}
      </Text>
      <Text className=" font-inter-regular text-[11px] text-[#6C6C6C]">Access Code</Text>
    </View>

    <View className="items-start justify-center h-[17px]">
      <Text className="text-sm font-inter-light text-[#0A1F29] ">
        {capitalizeWords(entry.name)}
      </Text>
    </View>

    <View className=" flex-row items-center justify-between mt-1 ">
      <Text className="text-sm font-inter-light capitalize text-[#6C6C6C]">{entry.category}</Text>
      <Text className="text-sm font-inter-light  text-[#0A1F29]">
        {formatAccessCode(entry.hashed_code)}
      </Text>
    </View>
  </Pressable>
);

export default function AccessLogScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const [mode, setMode] = useState<HistoryMode>('visitor');
  const [logs, setLogs] = useState<SecurityHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result =
        mode === 'visitor'
          ? await getEstateVisitorLogs({ page: 1, limit: 50 })
          : await getEstateResidentLogs({ page: 1, limit: 50 });

      const mapped: SecurityHistoryEntry[] =
        mode === 'visitor'
          ? (result as Awaited<ReturnType<typeof getEstateVisitorLogs>>).items.map(
              mapVisitorLogToSecurityEntry
            )
          : (result as Awaited<ReturnType<typeof getEstateResidentLogs>>).items.map(
              mapResidentLogToSecurityEntry
            );

      setLogs(mapped);
    } catch (e: any) {
      setError(e?.message?.trim() || 'Could not load access history.');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const groupedLogs = useMemo(() => groupLogsByMonth(logs), [logs]);

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
      },
    });
  };

  return (
    <SafeAreaView
      style={[sharedStyles.container, sharedStyles.modalContainer, { backgroundColor: '#F6F7F7' }]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <Pressable
        onPress={() => navigation.goBack()}
        className="h-[30px] w-[30px] items-center justify-center rounded-full bg-[#EFF1F1]"
      >
        <MaterialIcons name="keyboard-arrow-left" size={24} color="#113E55" />
      </Pressable>

      <ScreenHeader title="Access Log" subtitle="View all access code you have approved" />

      <View style={{ flex: 1, paddingTop: 24 }}>
        <View
          className="self-center flex-row mb-[37px]"
          style={{
            borderRadius: 999,
            backgroundColor: '#EFF1F1',
            overflow: 'hidden',
          }}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            style={{
              width: 148,
              paddingVertical: 13,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: mode === 'visitor' ? '#CEE5ED' : 'transparent',
            }}
            onPress={() => switchMode('visitor')}
          >
            <Text
              className={`font-inter-regular text-[11px] ${
                mode === 'visitor' ? 'text-[#113E55]' : 'text-[#6C6C6C]'
              }`}
            >
              Guest History
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            style={{
              width: 148,
              paddingVertical: 13,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: mode === 'resident' ? '#CEE5ED' : 'transparent',
            }}
            onPress={() => switchMode('resident')}
          >
            <Text
              className={`font-inter-regular text-[11px] ${
                mode === 'resident' ? 'text-[#113E55]' : 'text-[#6C6C6C]'
              }`}
            >
              Resident History
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#113E55" />
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 0, paddingBottom: 40, gap: 30 }}
            showsVerticalScrollIndicator={false}
          >
            {error ? (
              <Text className="px-6 text-center text-sm text-grey">{error}</Text>
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
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
