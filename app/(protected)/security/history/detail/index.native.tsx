import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useNavigation } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { sharedStyles } from '@/src/theme/styles';
import { ProfileAvatar, TimelineDashLine } from '@/src/assets/svgs';
import { mapResidentCodeHistoryToEvents } from '@/src/lib/accessLogMappers';
import { getEstateResidentLogByCode, getEstateVisitorLogByCode } from '@/src/lib/api/accessLogs';
import { ReceiverType } from '@/src/types/codes';

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

const formatTimelineDate = (date: Date) => {
  const day = date.getDate();
  const month = date.toLocaleString('en-GB', { month: 'long' });
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day} ${month} ${year}, ${hours}:${minutes}`;
};

type TimelineEvent = {
  id: string;
  title: string;
  timestamp: string;
};

const TIMELINE_DOT_SIZE = 28;
const TIMELINE_INNER_DOT_SIZE = 20;
const TIMELINE_DASH_UNIT = 2.8 + 2.8;
const TIMELINE_LINE_BETWEEN = 56;
const TIMELINE_LAST_OVERFLOW = TIMELINE_DASH_UNIT * 10;

const TimelineItem = ({ event, lineHeight }: { event: TimelineEvent; lineHeight: number }) => (
  <View className="flex-row" style={{ overflow: 'visible', gap: 19 }}>
    <View
      style={{
        width: TIMELINE_DOT_SIZE,
        alignItems: 'center',
        overflow: 'visible',
      }}
    >
      <View
        style={{
          width: TIMELINE_DOT_SIZE,
          height: TIMELINE_DOT_SIZE,
          borderRadius: TIMELINE_DOT_SIZE / 2,
          borderWidth: 1,
          borderColor: '#1B998B',
          backgroundColor: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: TIMELINE_INNER_DOT_SIZE,
            height: TIMELINE_INNER_DOT_SIZE,
            borderRadius: TIMELINE_INNER_DOT_SIZE / 2,
            backgroundColor: '#1B998B',
          }}
        />
      </View>
      <TimelineDashLine height={lineHeight} style={{ marginTop: 2 }} />
    </View>
    <View className="">
      <Text className="text-sm font-inter-medium text-[#0A1F29]">{event.title}</Text>
      <Text className="mt-1 text-sm font-inter-light text-[#6C6C6C] ">{event.timestamp}</Text>
    </View>
  </View>
);

export default function AccessLogDetailScreen() {
  const navigation = useNavigation();
  const params = useLocalSearchParams();

  const name = String(params.name || '');
  const category = String(params.category || '');
  const hashedCode = String(params.hashed_code || '');
  const receiver = String(params.receiver || 'visitor') as ReceiverType;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);

  const fetchHistory = useCallback(async () => {
    if (!hashedCode) {
      setError('Access log not found.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (receiver === 'resident') {
        const history = await getEstateResidentLogByCode(hashedCode, { page: 1, limit: 100 });
        const mapped = mapResidentCodeHistoryToEvents(history).map((event, index) => ({
          id: `${event.type}-${index}`,
          title:
            event.type === 'generated'
              ? 'Code Generated'
              : event.type === 'expired'
                ? 'Code Expired'
                : 'Access Granted',
          timestamp: formatTimelineDate(parseLogDate(event.timestamp)),
        }));
        setEvents(mapped);
        return;
      }

      const history = await getEstateVisitorLogByCode(hashedCode, { page: 1, limit: 100 });
      const mapped = history.items
        .sort((a, b) => parseLogDate(a.visit_time).getTime() - parseLogDate(b.visit_time).getTime())
        .map((item, index) => ({
          id: item.id,
          title: 'Access Granted',
          timestamp: formatTimelineDate(parseLogDate(item.visit_time)),
        }));

      setEvents(mapped);
    } catch (e: any) {
      setError(e?.message?.trim() || 'Could not load timeline.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [hashedCode, receiver]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const timelineEvents = useMemo(() => events, [events]);

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

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#113E55" />
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="items-center pt-11 pb-16"
          showsVerticalScrollIndicator={false}
          style={{ overflow: 'visible' }}
        >
          <View className="p-2">
            <View className="h-[88px] w-[88px] items-center justify-center rounded-full bg-[#04162D]">
              <ProfileAvatar width={100} height={100} />
            </View>
          </View>

          <Text className="mt-[11px] text-[21px] font-ubuntu-semibold text-[#0A1F29]">
            {capitalizeWords(name)}
          </Text>
          <Text className="mt-1.5 text-sm font-inter-light capitalize text-[#6C6C6C]">
            {category}
          </Text>

          <View className="mt-[59px] w-full px-3 pb-10" style={{ overflow: 'visible' }}>
            {error ? (
              <Text className="text-center text-sm text-grey">{error}</Text>
            ) : timelineEvents.length === 0 ? (
              <Text className="text-center text-sm text-grey">No timeline events found.</Text>
            ) : (
              timelineEvents.map((event, index) => (
                <TimelineItem
                  key={event.id}
                  event={event}
                  lineHeight={
                    index === timelineEvents.length - 1
                      ? TIMELINE_LAST_OVERFLOW
                      : TIMELINE_LINE_BETWEEN
                  }
                />
              ))
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
