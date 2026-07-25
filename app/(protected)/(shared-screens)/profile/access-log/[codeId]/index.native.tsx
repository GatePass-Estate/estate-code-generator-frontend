import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Stack, useLocalSearchParams, useNavigation, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import ScreenHeader from '@/src/components/mobile/ScreenHeader';
import AccessTimeline, { AccessTimelineEvent } from '@/src/components/mobile/AccessTimeline';
import { mapResidentCodeHistoryToEvents } from '@/src/lib/accessLogMappers';
import { getMyResidentAccessLogByCode } from '@/src/lib/api/accessLogs';
import { generateCode } from '@/src/lib/api/codes';
import { formatAccessLogTimestamp, parseLogDate } from '@/src/lib/helpers';
import { useUserStore } from '@/src/lib/stores/userStore';
import { AccessLogEvent } from '@/src/types/accessLog';
import { sharedStyles } from '@/src/theme/styles';

const EVENT_LABELS: Record<AccessLogEvent['type'], string> = {
  generated: 'Code Generated',
  validated: 'Code Validated',
  expired: 'Code Expired',
};

/** Profile usage log keeps its tighter 16px item spacing. */
const PROFILE_TIMELINE_GAP = 26;
const PROFILE_TIMELINE_LAST_OVERFLOW = 34;

export default function UsageLogScreen() {
  const navigation = useNavigation();
  const { codeId } = useLocalSearchParams<{ codeId: string }>();
  const { user_id, estate_id } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCodeActive, setIsCodeActive] = useState(false);
  const [events, setEvents] = useState<AccessTimelineEvent[]>([]);

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
        timestamp: formatAccessLogTimestamp(parseLogDate(event.timestamp)),
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
        <AccessTimeline
          className="w-full pb-10"
          events={timelineEvents}
          gap={PROFILE_TIMELINE_GAP}
          lastOverflow={PROFILE_TIMELINE_LAST_OVERFLOW}
          dashStyle={{ marginTop: 2 }}
        />
      </ScrollView>

      {!isCodeActive ? (
        <View className="absolute bottom-[60px] left-5 right-5 px-[9px]">
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
