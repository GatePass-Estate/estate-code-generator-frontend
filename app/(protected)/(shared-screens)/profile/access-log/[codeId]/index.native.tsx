import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Stack, useLocalSearchParams, useNavigation, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import ScreenHeader from '@/src/components/mobile/ScreenHeader';
import { TimelineDashLine } from '@/src/assets/svgs';
import { mapResidentCodeHistoryToEvents } from '@/src/lib/accessLogMappers';
import { getMyResidentAccessLogByCode } from '@/src/lib/api/accessLogs';
import { generateCode } from '@/src/lib/api/codes';
import { useUserStore } from '@/src/lib/stores/userStore';
import { AccessLogEvent } from '@/src/types/accessLog';
import { sharedStyles } from '@/src/theme/styles';

const EVENT_LABELS: Record<AccessLogEvent['type'], string> = {
  generated: 'Code Generated',
  validated: 'Code Validated',
  expired: 'Code Expired',
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
  isExpired: boolean;
};

const TIMELINE_DOT_SIZE = 28;
const TIMELINE_INNER_DOT_SIZE = 20;
const TIMELINE_DASH_UNIT = 2.8 + 2.8;
const TIMELINE_LINE_BETWEEN = TIMELINE_DASH_UNIT * 5;
const TIMELINE_LAST_OVERFLOW = TIMELINE_DASH_UNIT * 6;

const TimelineItem = ({
  event,
  lineHeight,
  showLine,
}: {
  event: TimelineEvent;
  lineHeight: number;
  showLine: boolean;
}) => (
  <View className="flex-row" style={{ gap: 19 }}>
    <View
      style={{
        width: TIMELINE_DOT_SIZE,
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: TIMELINE_DOT_SIZE,
          height: TIMELINE_DOT_SIZE,
          borderRadius: TIMELINE_DOT_SIZE / 2,
          borderWidth: 1,
          borderColor: event.isExpired ? '#9B9797' : '#1B998B',
          backgroundColor: event.isExpired ? '#EFF1F1' : '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: TIMELINE_INNER_DOT_SIZE,
            height: TIMELINE_INNER_DOT_SIZE,
            borderRadius: TIMELINE_INNER_DOT_SIZE / 2,
            backgroundColor: event.isExpired ? '#9B9797' : '#1B998B',
          }}
        />
      </View>
      {showLine ? <TimelineDashLine height={lineHeight} style={{ marginTop: 2 }} /> : null}
    </View>

    <View>
      <Text className="text-sm font-inter-medium text-[#0A1F29]">{event.title}</Text>
      <Text className="mt-1 text-sm font-inter-light text-[#6C6C6C] tracking-[-0.2px]">
        {event.timestamp}
      </Text>
    </View>
  </View>
);

export default function UsageLogScreen() {
  const navigation = useNavigation();
  const { codeId } = useLocalSearchParams<{ codeId: string }>();
  const { user_id, estate_id } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCodeActive, setIsCodeActive] = useState(false);
  const [events, setEvents] = useState<TimelineEvent[]>([]);

  const hashedCode = codeId ?? '';

  const fetchHistory = useCallback(async () => {
    if (!hashedCode) {
      setError('Access log not found.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const history = await getMyResidentAccessLogByCode(hashedCode, { page: 1, limit: 100 });
      const mappedEvents = mapResidentCodeHistoryToEvents(history).map((event) => ({
        id: event.id,
        title: EVENT_LABELS[event.type],
        timestamp: formatTimelineDate(new Date(event.timestamp)),
        isExpired: event.type === 'expired',
      }));

      setEvents(mappedEvents);
      setIsCodeActive(!history.code_deleted);
    } catch (e: any) {
      setError(e?.message?.trim() || 'Could not load usage log.');
      setEvents([]);
      setIsCodeActive(false);
    } finally {
      setLoading(false);
    }
  }, [hashedCode]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleRegenerateCode = useCallback(async () => {
    if (!user_id) return;
    setRegenerating(true);
    try {
      await generateCode({ user_id, estate_id: estate_id ?? '' }, 'resident');
      Alert.alert('Code regenerated', 'Your new access code is ready on your profile.', [
        { text: 'OK', onPress: () => router.replace('/profile') },
      ]);
    } catch {
      Alert.alert('Could not regenerate code', 'Please try again later.');
    } finally {
      setRegenerating(false);
    }
  }, [user_id, estate_id]);

  const timelineEvents = useMemo(() => events, [events]);

  if (loading) {
    return (
      <SafeAreaView
        style={[
          sharedStyles.container,
          sharedStyles.modalContainer,
          { backgroundColor: '#F6F7F7' },
        ]}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#113E55" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        style={[
          sharedStyles.container,
          sharedStyles.modalContainer,
          { backgroundColor: '#F6F7F7' },
        ]}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <Pressable
          onPress={() => navigation.goBack()}
          className="h-[30px] w-[30px] items-center justify-center rounded-full bg-[#EFF1F1]"
        >
          <MaterialIcons name="keyboard-arrow-left" size={24} color="#113E55" />
        </Pressable>
        <Text className="mt-6 text-base font-inter-regular text-[#6C6C6C]">{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        sharedStyles.container,
        sharedStyles.modalContainer,
        { flex: 1, backgroundColor: '#F6F7F7' },
      ]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View className="bg-[#F6F7F7]" style={{ zIndex: 1 }}>
        <Pressable
          onPress={() => navigation.goBack()}
          className="h-[30px] w-[30px] items-center justify-center rounded-full bg-[#EFF1F1]"
        >
          <MaterialIcons name="keyboard-arrow-left" size={24} color="#113E55" />
        </Pressable>

        <ScreenHeader
          subtitleClassName="text-[#0A1F29] font-inter-light"
          title="Usage log"
          subtitle="View the number of time access code was used"
        />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: isCodeActive ? 120 : 40, paddingTop: 31 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full pb-10">
          {timelineEvents.length === 0 ? (
            <Text className="text-center text-sm text-grey">No timeline events found.</Text>
          ) : (
            timelineEvents.map((event, index) => {
              const isLast = index === timelineEvents.length - 1;
              const endsWithExpired = isLast && event.isExpired;

              return (
                <TimelineItem
                  key={event.id}
                  event={event}
                  showLine={!endsWithExpired}
                  lineHeight={isLast ? TIMELINE_LAST_OVERFLOW : TIMELINE_LINE_BETWEEN}
                />
              );
            })
          )}
        </View>
      </ScrollView>

      {!isCodeActive ? (
        <View className="absolute bottom-10 left-5 right-5 px-[9px]">
          <Pressable
            onPress={handleRegenerateCode}
            disabled={regenerating}
            className="items-center justify-center rounded-full bg-primary p-4"
          >
            {regenerating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-sm font-ubuntu-semibold text-white">Regenerate Code</Text>
            )}
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
