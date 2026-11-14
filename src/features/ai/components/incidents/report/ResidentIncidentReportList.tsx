import { useGoBack } from '@/src/shared/hooks/useGoBack';
import { useCallback, useState } from 'react';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  BackHandler,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '@/src/shared/components/layout/ScreenHeader';
import { CircleLoader } from '@/src/shared/components/feedback/ScreenLoading';
import icons from '@/src/shared/constants/icons';
import { useFeatureGate } from '@/src/features/billing/hooks/usePlan';
import { useManagedIncidentReports } from '@/src/features/ai/hooks/operations';
import {
  leaveIncidentReport,
  parseIncidentReportReturnTo,
} from '@/src/features/ai/utils/incidentReportNavigation';
import {
  incidentReportSentLabel,
  incidentReportTitle,
} from '@/src/features/ai/utils/incidentReportLabel';
import { sharedStyles } from '@/src/shared/theme/styles';

type DetailPath = '/incident-report/[id]' | '/user/report/mine/[id]';

/**
 * The resident's own incident reports. Two routes share it: the shared incident-report list and
 * the user "mine" list. The title and the detail route stay with the caller.
 */
export default function ResidentIncidentReportList({
  title,
  detailPath,
}: {
  title: string;
  detailPath: DetailPath;
}) {
  const goBack = useGoBack();
  const router = useRouter();
  const { returnTo: returnToParam } = useLocalSearchParams<{ returnTo?: string }>();
  const returnTo = parseIncidentReportReturnTo(returnToParam);
  const { requestAccessWhenReady } = useFeatureGate('incident_report', { notice: 'floating' });
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [accessReady, setAccessReady] = useState(false);
  const reportsQuery = useManagedIncidentReports('mine', accessReady);
  const reports = reportsQuery.data ?? [];
  const loading = accessReady && reportsQuery.isLoading;
  const [refreshing, setRefreshing] = useState(false);
  const error = reportsQuery.isError ? 'Unable to load your reports. Pull down to try again.' : '';

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      goBack();
      return;
    }
    leaveIncidentReport(returnTo, router);
  }, [goBack, returnTo, router]);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return;
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        handleBack();
        return true;
      });
      return () => subscription.remove();
    }, [handleBack])
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        const allowed = await requestAccessWhenReady(() => active);
        if (!active) return;
        if (allowed) {
          setCheckingAccess(false);
          setAccessReady(true);
        } else {
          handleBack();
        }
      })();
      return () => {
        active = false;
      };
    }, [handleBack, requestAccessWhenReady])
  );

  return (
    <SafeAreaView style={[sharedStyles.container, { backgroundColor: '#F6F7F7' }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
      <ScreenHeader
        onBack={handleBack}
        title={title}
        subtitle="View all reports observed in your space."
        titleClassName="ml-[4px] text-heading leading-[33px]"
        subtitleClassName="ml-[3px] text-[14px] leading-[17px] text-[#878686]"
      />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void reportsQuery.refetch().finally(() => setRefreshing(false));
            }}
          />
        }
      >
        <View className="mt-[36px] mx-[9px] gap-[1px]">
          {checkingAccess || loading ? (
            <View className="items-center py-6">
              <CircleLoader size={36} />
            </View>
          ) : null}
          {!loading && error ? (
            <Text className="text-[13px] leading-[18px] text-[#B42318] font-inter-regular">
              {error}
            </Text>
          ) : null}
          {!loading && !error && reports.length === 0 ? (
            <Text className="text-[13px] leading-[18px] text-[#878686] font-inter-regular">
              You have not submitted any reports yet.
            </Text>
          ) : null}
          {reports.map((report) => (
            <TouchableOpacity
              key={report.id}
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: detailPath,
                  params: { id: report.id, returnTo },
                })
              }
              className="h-[67px] flex-row items-center justify-between rounded-[16px] border-[0.4px] border-accent px-4"
            >
              <View className="min-w-0 flex-1 pr-3">
                <Text
                  numberOfLines={1}
                  className="text-[14px] leading-[17px] text-[#0A1F29] font-inter-light"
                >
                  {incidentReportTitle(report)}
                </Text>
                <Text
                  numberOfLines={1}
                  className="mt-[4px] text-caption leading-[14px] text-[#878686] font-inter-regular"
                >
                  {incidentReportSentLabel(report.created_at)}
                </Text>
              </View>
              <Image
                source={icons.slideUp}
                style={{ width: 16, height: 16 }}
                resizeMode="contain"
              />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
