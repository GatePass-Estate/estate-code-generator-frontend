import { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Stack, useLocalSearchParams, useNavigation, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import ScreenHeader from '@/src/components/mobile/ScreenHeader';
import { TimelineDashLine } from '@/src/assets/svgs';
import { getResidentAccessLogById } from '@/src/data/mockResidentAccessLogs';
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
const TIMELINE_LINE_BETWEEN = TIMELINE_DASH_UNIT * 6;
const TIMELINE_LAST_OVERFLOW = TIMELINE_DASH_UNIT * 6;

const TimelineItem = ({ event, lineHeight }: { event: TimelineEvent; lineHeight: number }) => (
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
      <TimelineDashLine height={lineHeight} style={{ marginTop: 2 }} />
    </View>

    <View>
      <Text className="text-xs font-ubuntu-semibold text-[#0A1F29]">{event.title}</Text>
      <Text className="mt-1 text-base font-ubuntu-regular text-[#6C6C6C] tracking-[-0.2px]">
        {event.timestamp}
      </Text>
    </View>
  </View>
);

export default function UsageLogScreen() {
  const navigation = useNavigation();
  const { codeId } = useLocalSearchParams<{ codeId: string }>();
  const { user_id, estate_id } = useUserStore();
  const [loading, setLoading] = useState(false);

  const log = getResidentAccessLogById(codeId ?? '');

  const events = useMemo<TimelineEvent[]>(() => {
    if (!log) return [];

    return log.events.map((event) => ({
      id: event.id,
      title: EVENT_LABELS[event.type],
      timestamp: formatTimelineDate(new Date(event.timestamp)),
      isExpired: event.type === 'expired',
    }));
  }, [log]);

  const handleRegenerateCode = useCallback(async () => {
    if (!user_id) return;
    setLoading(true);
    try {
      await generateCode({ user_id, estate_id: estate_id ?? '' }, 'resident');
      Alert.alert('Code regenerated', 'Your new access code is ready on your profile.', [
        { text: 'OK', onPress: () => router.replace('/profile') },
      ]);
    } catch {
      Alert.alert('Could not regenerate code', 'Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [user_id, estate_id]);

  if (!log) {
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
        <Text className="mt-6 text-base font-inter-regular text-[#6C6C6C]">
          Access log not found.
        </Text>
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

        <ScreenHeader title="Usage log" subtitle="View the number of time access code was used" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 21 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full pb-10">
          {events.map((event, index) => (
            <TimelineItem
              key={event.id}
              event={event}
              lineHeight={
                index === events.length - 1 ? TIMELINE_LAST_OVERFLOW : TIMELINE_LINE_BETWEEN
              }
            />
          ))}
        </View>
      </ScrollView>

      <View className="absolute bottom-8 left-5 right-5">
        <Pressable
          onPress={handleRegenerateCode}
          disabled={loading}
          className="items-center justify-center rounded-full bg-primary py-4"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-base font-ubuntu-medium text-white">Regenerate Code</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
