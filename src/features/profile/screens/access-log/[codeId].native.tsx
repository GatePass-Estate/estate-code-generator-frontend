import { useCallback, useMemo, useState } from 'react';
import ScreenLoading, { CircleLoader } from '@/src/shared/components/feedback/ScreenLoading';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { Stack, useLocalSearchParams, useNavigation, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Back from '@/src/shared/components/navigation/Back';
import ScreenHeader from '@/src/shared/components/layout/ScreenHeader';
import AccessTimeline, {
  AccessTimelineEvent,
} from '@/src/features/history/components/AccessTimeline';
import { mapResidentCodeHistoryToEvents } from '@/src/features/history/utils/accessLogMappers';
import { useMyResidentAccessLogByCode } from '@/src/features/history/hooks/accessLogs';
import { useGenerateCode } from '@/src/features/access-codes/hooks/codes';
import { formatAccessLogTimestamp, parseLogDate } from '@/src/shared/utils/helpers';
import { useFeatureGate } from '@/src/features/billing/hooks/usePlan';
import { useUserStore } from '@/src/store/userStore';
import { AccessLogEvent } from '@/src/features/history/types/accessLog';
import { sharedStyles } from '@/src/shared/theme/styles';

const EVENT_LABELS: Record<AccessLogEvent['type'], string> = {
  generated: 'Code Generated',
  validated: 'Code Validated',
  expired: 'Code Expired',
};

/** Profile usage log keeps its tighter 16px item spacing. */
const PROFILE_TIMELINE_GAP = 26;

export default function UsageLogScreen() {
  const navigation = useNavigation();
  const { codeId } = useLocalSearchParams<{ codeId: string }>();
  const user_id = useUserStore((s) => s.user_id);
  const estate_id = useUserStore((s) => s.estate_id);
  const { requestAccess: requestCodeAccess } = useFeatureGate('advanced_code_management', {
    notice: 'floating',
  });
  const hashedCode = codeId ?? '';
  const historyQuery = useMyResidentAccessLogByCode(hashedCode, { page: 1, limit: 100 });
  const generateResidentCode = useGenerateCode();
  const [regenerating, setRegenerating] = useState(false);
  const loading = Boolean(hashedCode) && historyQuery.isLoading;
  const error = !hashedCode
    ? 'Access log not found.'
    : historyQuery.isError
      ? historyQuery.error.message.trim() || 'Could not load usage log.'
      : null;
  const isCodeActive = Boolean(historyQuery.data && !historyQuery.data.code_deleted);
  const events = useMemo<AccessTimelineEvent[]>(() => {
    if (!historyQuery.data) return [];
    return mapResidentCodeHistoryToEvents(historyQuery.data).map((event) => ({
      id: event.id,
      title: EVENT_LABELS[event.type],
      timestamp: formatAccessLogTimestamp(parseLogDate(event.timestamp)),
      isExpired: event.type === 'expired',
    }));
  }, [historyQuery.data]);

  const handleRegenerateCode = useCallback(async () => {
    if (!user_id) return;
    if (!requestCodeAccess()) return;
    setRegenerating(true);
    try {
      await generateResidentCode.mutateAsync({
        user_id,
        estate_id: estate_id ?? '',
        receiver: 'resident',
      });
      Alert.alert('Code regenerated', 'Your new access code is ready on your profile.', [
        { text: 'OK', onPress: () => router.replace('/profile') },
      ]);
    } catch {
      Alert.alert('Could not regenerate code', 'Please try again later.');
    } finally {
      setRegenerating(false);
    }
  }, [estate_id, generateResidentCode, requestCodeAccess, user_id]);

  const timelineEvents = events;

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
        <ScreenLoading />
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
        <Back type="short-arrow" onPress={() => navigation.goBack()} />
        <Text className="mt-6 text-base font-inter-regular text-[#6C6C6C]">{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[sharedStyles.container, { flex: 1, backgroundColor: '#F6F7F7' }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="bg-[#F6F7F7]" style={{ zIndex: 1 }}>
        <ScreenHeader
          onBack={() => navigation.goBack()}
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
              <CircleLoader size={22} tone="light" />
            ) : (
              <Text className="text-sm font-ubuntu-semibold text-white">Regenerate Code</Text>
            )}
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
