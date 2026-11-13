import { useGoBack } from '@/src/shared/hooks/useGoBack';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CircleLoader } from '@/src/shared/components/feedback/ScreenLoading';
import Back from '@/src/shared/components/navigation/Back';
import { useFeatureGate } from '@/src/features/billing/hooks/usePlan';
import type { IncidentReport } from '@/src/features/ai/services/incidentManagement';
import { useManagedIncidentReport } from '@/src/features/ai/hooks/operations';
import {
  leaveIncidentReport,
  parseIncidentReportReturnTo,
} from '@/src/features/ai/utils/incidentReportNavigation';

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

export default function IncidentReportDetailScreen() {
  const goBack = useGoBack();
  const { id, returnTo: returnToParam } = useLocalSearchParams<{
    id?: string;
    returnTo?: string;
  }>();
  const returnTo = parseIncidentReportReturnTo(returnToParam);
  const router = useRouter();
  const { requestAccessWhenReady } = useFeatureGate('incident_report', { notice: 'floating' });
  const [accessReady, setAccessReady] = useState(false);
  const reportQuery = useManagedIncidentReport(id, 'mine', accessReady);
  const report = reportQuery.data ?? null;
  const loading = !accessReady || (Boolean(id) && reportQuery.isLoading);
  const error = !id
    ? 'Report not found.'
    : reportQuery.isError
      ? 'Unable to load this report. Please try again.'
      : '';

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      goBack();
      return;
    }
    leaveIncidentReport(returnTo, router);
  }, [goBack, returnTo, router]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        const allowed = await requestAccessWhenReady(() => active);
        if (!active) return;
        if (allowed) setAccessReady(true);
        else handleBack();
      })();
      return () => {
        active = false;
      };
    }, [handleBack, requestAccessWhenReady])
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F6F7F7]" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="px-5 pt-[19px]">
        <View className="h-[30px] flex-row items-center">
          <Back
            type="short-arrow"
            showText={false}
            showBorder
            borderSize={30}
            leftOffset={-3}
            onPress={handleBack}
          />
        </View>
        {report ? (
          <View className="mt-[20px] mb-[28px]">
            <Text
              className="ml-[3px] text-heading-sm leading-[26px] text-[#0A1F29] font-ubuntu-semibold"
              numberOfLines={2}
            >
              {report.title?.trim() || categoryLabel(report)}
            </Text>
            <Text className="ml-[6px] mt-[6px] text-caption leading-[14px] text-[#0A1F29] font-inter-regular">
              Category: {categoryLabel(report)}.
            </Text>
            <Text className="ml-[6px] mt-[6px] text-caption leading-[14px] text-[#0A1F29] font-inter-regular">
              Reported: {displayDate(report.created_at)}.
            </Text>
          </View>
        ) : null}
      </View>
      <View className="flex-1 bg-white px-[23px] pt-[29px]">
        {loading ? (
          <View className="items-center py-6">
            <CircleLoader size={48} />
          </View>
        ) : null}
        {!loading && error ? (
          <Pressable onPress={() => void reportQuery.refetch()}>
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
