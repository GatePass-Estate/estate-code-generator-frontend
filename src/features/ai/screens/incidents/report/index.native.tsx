import { useCallback, useMemo, useState } from 'react';
import {
  BackHandler,
  Image,
  Platform,
  RefreshControl,
  SectionList,
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

type ReportSection = {
  key: 'new' | 'read';
  title: string;
  data: IncidentReport[];
};

const NEW_REPORT_CARD_HEIGHT = 67;
const REPORT_CARD_GAP = 1;

function ReportCardSeparator() {
  return <View style={{ height: REPORT_CARD_GAP }} />;
}

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

  const reportSections = useMemo<ReportSection[]>(() => {
    const items = reportsQuery.data ?? [];
    return [
      {
        key: 'new',
        title: 'New Reports',
        data: items.filter((report) => !report.is_read),
      },
      {
        key: 'read',
        title: 'Read Reports',
        data: items.filter((report) => report.is_read),
      },
    ];
  }, [reportsQuery.data]);
  const newReports = reportSections[0].data;
  const readReports = reportSections[1].data;
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
      <SectionList
        style={accessDenied ? { flex: 1, display: 'none' } : { flex: 1 }}
        sections={reportSections}
        keyExtractor={(report) => report.id}
        extraData={`${loading}|${visibleError}|${clearing}|${newReportsEmpty}|${returnTo}`}
        stickySectionHeadersEnabled={false}
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
        ItemSeparatorComponent={ReportCardSeparator}
        renderSectionHeader={({ section }) =>
          section.key === 'read' ? (
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
          ) : (
            <View>
              <Text className="mt-[36px] ml-[29px] mb-[16px] text-caption leading-[14px] text-[#878686] font-inter-regular">
                New Reports
              </Text>
              {loading ? (
                <View
                  className="mx-[9px] items-center py-6"
                  style={{ minHeight: newReportsMinHeight }}
                >
                  <CircleLoader size={36} />
                </View>
              ) : null}
              {!loading && visibleError ? (
                <View
                  className="mx-[9px]"
                  style={newReports.length === 0 ? { minHeight: newReportsMinHeight } : undefined}
                >
                  <Text className="text-[13px] text-[#B42318] font-inter-regular">
                    {visibleError}
                  </Text>
                </View>
              ) : null}
              {newReportsEmpty ? (
                <View
                  className="mx-[9px] items-center justify-center"
                  style={{ minHeight: newReportsMinHeight }}
                >
                  <Text className="text-[13px] text-[#878686] font-inter-regular">
                    No new reports.
                  </Text>
                </View>
              ) : null}
            </View>
          )
        }
        renderItem={({ item, section }) => (
          <View className={section.key === 'read' ? 'ml-[10px] mr-[8px]' : 'mx-[9px]'}>
            <ReportCard
              report={item}
              onPress={() =>
                router.push({
                  pathname: '/user/report/[id]',
                  params: { id: item.id, returnTo },
                })
              }
            />
          </View>
        )}
        renderSectionFooter={({ section }) => {
          if (section.key === 'new') {
            if (newReports.length === 0) return null;
            const contentHeight =
              newReports.length * NEW_REPORT_CARD_HEIGHT +
              (newReports.length - 1) * REPORT_CARD_GAP;
            const extra = newReportsMinHeight - contentHeight;
            if (extra <= 0) return null;
            return <View style={{ height: extra }} />;
          }
          if (!loading && !visibleError && readReports.length === 0) {
            return (
              <View className="mx-[9px] min-h-[56px] items-center justify-center">
                <Text className="text-[13px] text-[#878686] font-inter-regular">
                  No read reports.
                </Text>
              </View>
            );
          }
          return null;
        }}
      />
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
