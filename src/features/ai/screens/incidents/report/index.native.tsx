import { useCallback, useState } from 'react';
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
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '@/src/shared/components/layout/ScreenHeader';
import { CircleLoader } from '@/src/shared/components/feedback/ScreenLoading';
import ActionConfirmModal from '@/src/shared/components/feedback/ActionConfirmModal';
import IncidentReportCategoryScreen from '@/src/features/ai/components/incidents/report/IncidentReportCategoryScreen';
import icons from '@/src/shared/constants/icons';
import {
  useClearReadIncidentReports,
  useManagedIncidentReports,
} from '@/src/features/ai/hooks/operations';
import type { IncidentReport } from '@/src/features/ai/services/incidentManagement';
import {
  incidentReportSentLabel,
  incidentReportTitle,
} from '@/src/features/ai/utils/incidentReportLabel';
import { useFeatureGate } from '@/src/features/billing/hooks/usePlan';
import { useUserStore } from '@/src/store/userStore';
import {
  leaveIncidentReport,
  parseIncidentReportReturnTo,
} from '@/src/features/ai/utils/incidentReportNavigation';
import { sharedStyles } from '@/src/shared/theme/styles';

function ReportCard({ report, onPress }: { report: IncidentReport; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
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
      <Image source={icons.slideUp} style={{ width: 16, height: 16 }} resizeMode="contain" />
    </TouchableOpacity>
  );
}

export default function ReportTabScreen() {
  const router = useRouter();
  const { returnTo: returnToParam } = useLocalSearchParams<{ returnTo?: string }>();
  const returnTo = parseIncidentReportReturnTo(returnToParam);
  const role = useUserStore((state) => state.role);
  const isAdmin = role === 'admin' || role === 'primary_admin' || role === 'root';
  const { requestAccessWhenReady } = useFeatureGate('incident_report', { notice: 'floating' });
  const [accessReady, setAccessReady] = useState(false);
  const reportsQuery = useManagedIncidentReports('all', isAdmin && accessReady);
  const clearReadMutation = useClearReadIncidentReports();
  const reports = reportsQuery.data ?? [];
  const loading = isAdmin && accessReady && reportsQuery.isLoading;
  const [refreshing, setRefreshing] = useState(false);
  const [confirmClearRead, setConfirmClearRead] = useState(false);
  const [error, setError] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);
  const clearing = clearReadMutation.isPending;
  const loadError = reportsQuery.isError
    ? 'Unable to load incident reports. Pull down to try again.'
    : '';
  const visibleError = error || loadError;

  useFocusEffect(
    useCallback(() => {
      if (!isAdmin || Platform.OS !== 'android') return;
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        leaveIncidentReport(returnTo, router);
        return true;
      });
      return () => subscription.remove();
    }, [isAdmin, returnTo, router])
  );

  useFocusEffect(
    useCallback(() => {
      if (!isAdmin) return;
      let active = true;
      void (async () => {
        const allowed = await requestAccessWhenReady(() => active);
        if (!active) return;
        if (allowed) {
          setAccessDenied(false);
          setAccessReady(true);
        } else {
          setAccessDenied(true);
        }
      })();
      return () => {
        active = false;
      };
    }, [isAdmin, requestAccessWhenReady])
  );

  const clearRead = async () => {
    if (clearing) return;
    try {
      await clearReadMutation.mutateAsync();
      setError('');
    } catch {
      setError('Unable to clear read reports. Please try again.');
    } finally {
      setConfirmClearRead(false);
    }
  };

  const newReports = reports.filter((report) => !report.is_read);
  const readReports = reports.filter((report) => report.is_read);
  const newReportsEmpty = !loading && !visibleError && newReports.length === 0;
  const newReportsMinHeight = newReportsEmpty ? 56 : 135;

  if (!isAdmin) return <IncidentReportCategoryScreen />;

  return (
    <SafeAreaView style={[sharedStyles.container, { backgroundColor: '#F6F7F7' }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
      <ScreenHeader
        onBack={() => leaveIncidentReport(returnTo, router)}
        title="Incident Report"
        subtitle="View all reports observed in your space."
        titleClassName="ml-[4px] text-heading leading-[33px]"
        subtitleClassName="ml-[3px] text-[14px] leading-[17px] text-[#878686]"
      />
      {accessDenied && (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-[14px] leading-[20px] text-[#878686] font-inter-regular">
            Incident reports are not available on this estate&apos;s current plan.
          </Text>
        </View>
      )}
      <ScrollView
        className="flex-1"
        style={accessDenied ? { display: 'none' } : undefined}
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
        <Text className="mt-[36px] ml-[29px] mb-[16px] text-caption leading-[14px] text-[#878686] font-inter-regular">
          New Reports
        </Text>
        <View className="mx-[9px] gap-[1px]" style={{ minHeight: newReportsMinHeight }}>
          {loading ? (
            <View className="items-center py-6">
              <CircleLoader size={48} />
            </View>
          ) : null}
          {!loading && visibleError ? (
            <Text className="text-[13px] text-[#B42318] font-inter-regular">{visibleError}</Text>
          ) : null}
          {newReportsEmpty ? (
            <View
              className="items-center justify-center"
              style={{ minHeight: newReportsMinHeight }}
            >
              <Text className="text-[13px] text-[#878686] font-inter-regular">No new reports.</Text>
            </View>
          ) : null}
          {newReports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onPress={() =>
                router.push({
                  pathname: '/user/report/[id]',
                  params: { id: report.id, returnTo },
                })
              }
            />
          ))}
        </View>
        <View
          className="relative mx-[9px] h-[39px]"
          style={{ marginTop: newReportsEmpty ? 0 : 15 }}
        >
          <Text className="absolute left-[20px] top-[9px] text-caption leading-[14px] text-[#878686] font-inter-regular">
            Read Reports
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            className="absolute right-[9px] top-0 h-[40px] w-[46px] items-center justify-center"
            onPress={() => setConfirmClearRead(true)}
            disabled={clearing || readReports.length === 0}
          >
            <Text className="text-caption leading-[14px] text-primary font-inter-semibold">
              {clearing ? '…' : 'Clear All'}
            </Text>
          </TouchableOpacity>
        </View>
        {!loading && !visibleError && readReports.length === 0 ? (
          <View className="mx-[9px] min-h-[56px] items-center justify-center">
            <Text className="text-[13px] text-[#878686] font-inter-regular">No read reports.</Text>
          </View>
        ) : null}
        <View className="ml-[10px] mr-[8px] gap-[1px]">
          {readReports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onPress={() =>
                router.push({
                  pathname: '/user/report/[id]',
                  params: { id: report.id, returnTo },
                })
              }
            />
          ))}
        </View>
      </ScrollView>
      <ActionConfirmModal
        visible={confirmClearRead}
        title="Clear Read Reports?"
        message="Remove all read reports from this list? This action cannot be undone."
        confirmLabel="Clear All"
        busy={clearing}
        onConfirm={() => void clearRead()}
        onCancel={() => setConfirmClearRead(false)}
      />
    </SafeAreaView>
  );
}
