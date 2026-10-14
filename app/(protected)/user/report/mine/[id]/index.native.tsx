import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Back from '@/src/components/mobile/Back';
import { useFeatureGate } from '@/src/hooks/usePlan';
import { incidentManagementApi, type IncidentReport } from '@/src/lib/api/incidentManagement';
import { useUserStore } from '@/src/lib/stores/userStore';

function displayDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const day = date.getDate();
  const suffix =
    day % 10 === 1 && day !== 11
      ? 'st'
      : day % 10 === 2 && day !== 12
        ? 'nd'
        : day % 10 === 3 && day !== 13
          ? 'rd'
          : 'th';
  return `${day}${suffix} ${date.toLocaleString('en-GB', { month: 'long' })}, ${date.getFullYear()}`;
}

function categoryLabel(report: IncidentReport): string {
  return (report.custom_category || report.category[0] || 'Not specified')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function MyIncidentReportDetailScreen() {
  const { id, returnTo } = useLocalSearchParams<{ id?: string; returnTo?: string }>();
  const router = useRouter();
  const role = useUserStore((state) => state.role);
  const { requestAccessWhenReady } = useFeatureGate('incident_report', { notice: 'floating' });
  const [report, setReport] = useState<IncidentReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!id) {
      setError('Report not found.');
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setReport(await incidentManagementApi.getMy(id));
      setError('');
    } catch {
      setReport(null);
      setError('Unable to load this report. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      if (role !== 'resident' && role !== 'security') {
        router.replace('/user/report');
        return;
      }
      let active = true;
      void (async () => {
        const allowed = await requestAccessWhenReady(() => active);
        if (!active) return;
        if (allowed) await load();
        else router.replace('/user');
      })();
      return () => {
        active = false;
      };
    }, [load, requestAccessWhenReady, role, router])
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F6F7F7]" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="px-5 pt-[29px]">
        <View className="h-[30px] flex-row items-center">
          <Back
            type="short-arrow"
            showText={false}
            showBorder
            borderSize={30}
            leftOffset={-3}
            onPress={() =>
              router.replace({
                pathname: '/user/report/mine',
                params: { returnTo: returnTo || '/user' },
              })
            }
          />
        </View>
        {report ? (
          <View className="mt-[20px] mb-[28px]">
            <Text
              className="ml-[3px] text-[21.88px] leading-[26px] text-[#0A1F29] font-ubuntu-semibold"
              numberOfLines={2}
            >
              {report.title?.trim() || categoryLabel(report)}
            </Text>
            <Text className="ml-[6px] mt-[6px] text-[11.2px] leading-[14px] text-[#0A1F29] font-inter-regular">
              Category: {categoryLabel(report)}.
            </Text>
            <Text className="ml-[6px] mt-[6px] text-[11.2px] leading-[14px] text-[#0A1F29] font-inter-regular">
              Reported: {displayDate(report.created_at)}.
            </Text>
          </View>
        ) : null}
      </View>
      <View className="flex-1 bg-white px-[23px] pt-[29px]">
        {loading ? <ActivityIndicator color="#113E55" /> : null}
        {!loading && error ? (
          <Pressable onPress={() => void load()}>
            <Text className="text-[14px] text-[#B42318] font-inter-regular">{error}</Text>
          </Pressable>
        ) : null}
        {!loading && report ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            <Text className="text-[14px] leading-[14px] text-[#0A1F29] font-inter-light">
              {report.narrative}
            </Text>
          </ScrollView>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
