import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
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
import Back from '@/src/components/mobile/Back';
import ActionConfirmModal from '@/src/components/mobile/ActionConfirmModal';
import IncidentReportCategoryScreen from '@/src/components/incident/IncidentReportCategoryScreen';
import icons from '@/src/constants/icons';
import { incidentManagementApi, type IncidentReport } from '@/src/lib/api/incidentManagement';
import { useFeatureGate } from '@/src/hooks/usePlan';
import { useUserStore } from '@/src/lib/stores/userStore';
import {
  leaveIncidentReport,
  parseIncidentReportReturnTo,
} from '@/src/lib/incidentReportNavigation';
import { sharedStyles } from '@/src/theme/styles';

function reportTitle(report: IncidentReport): string {
  if (report.title?.trim()) return report.title.trim();
  if (report.custom_category?.trim()) return report.custom_category.trim();
  const category = report.category[0];
  if (!category) return 'Incident Report';
  return category.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function reportDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const day = date.getDate();
  const suffix =
    day % 10 === 1 && day !== 11
      ? 'st'
      : day % 10 === 2 && day !== 12
        ? 'nd'
        : day % 10 === 3 && day !== 13
          ? 'rd'
          : 'th';
  return `Sent: ${day}${suffix} ${date.toLocaleString('en-GB', { month: 'long' })}, ${date.getFullYear()}`;
}

function ReportCard({ report, onPress }: { report: IncidentReport; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      className="h-[67px] flex-row items-center justify-between rounded-[16px] border-[0.4px] border-[#CEE5ED] px-4"
    >
      <View className="min-w-0 flex-1 pr-3">
        <Text
          numberOfLines={1}
          className="text-[14px] leading-[17px] text-[#0A1F29] font-inter-light"
        >
          {reportTitle(report)}
        </Text>
        <Text
          numberOfLines={1}
          className="mt-[4px] text-[11.2px] leading-[14px] text-[#878686] font-inter-regular"
        >
          {reportDate(report.created_at)}
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
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [confirmClearRead, setConfirmClearRead] = useState(false);
  const [error, setError] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);

  const load = useCallback(async () => {
    try {
      setReports(await incidentManagementApi.listAll());
      setError('');
    } catch {
      setError('Unable to load incident reports. Pull down to try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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
          await load();
        } else {
          setAccessDenied(true);
          setLoading(false);
          setReports([]);
        }
      })();
      return () => {
        active = false;
      };
    }, [isAdmin, load, requestAccessWhenReady])
  );

  const clearRead = async () => {
    if (clearing) return;
    setClearing(true);
    try {
      await incidentManagementApi.clearRead();
      await load();
    } catch {
      setError('Unable to clear read reports. Please try again.');
    } finally {
      setConfirmClearRead(false);
      setClearing(false);
    }
  };

  const newReports = reports.filter((report) => !report.is_read);
  const readReports = reports.filter((report) => report.is_read);
  const newReportsEmpty = !loading && !error && newReports.length === 0;
  const newReportsMinHeight = newReportsEmpty ? 56 : 135;

  if (!isAdmin) return <IncidentReportCategoryScreen />;

  return (
    <SafeAreaView
      style={[sharedStyles.container, { paddingTop: 29, backgroundColor: '#F6F7F7' }]}
      edges={['top']}
    >
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
      <Back
        type="short-arrow"
        showText={false}
        showBorder
        borderSize={30}
        leftOffset={-3}
        onPress={() => leaveIncidentReport(returnTo, router)}
      />
      <Text className="mt-[13px] ml-[4px] text-[27.34px] leading-[33px] text-[#113E55] font-ubuntu-medium">
        Incident Report
      </Text>
      <Text className="mt-[12px] ml-[3px] text-[14px] leading-[17px] text-[#878686] font-inter-light">
        View all reports observed in your space.
      </Text>
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
              void load();
            }}
          />
        }
      >
        <Text className="mt-[36px] ml-[29px] mb-[16px] text-[11.2px] leading-[14px] text-[#878686] font-inter-regular">
          New Reports
        </Text>
        <View className="mx-[9px] gap-[1px]" style={{ minHeight: newReportsMinHeight }}>
          {loading ? <ActivityIndicator color="#113E55" /> : null}
          {!loading && error ? (
            <Text className="text-[13px] text-[#B42318] font-inter-regular">{error}</Text>
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
          <Text className="absolute left-[20px] top-[9px] text-[11.2px] leading-[14px] text-[#878686] font-inter-regular">
            Read Reports
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            className="absolute right-[9px] top-0 h-[40px] w-[46px] items-center justify-center"
            onPress={() => setConfirmClearRead(true)}
            disabled={clearing || readReports.length === 0}
          >
            <Text className="text-[11.2px] leading-[14px] text-[#113E55] font-inter-semibold">
              {clearing ? '…' : 'Clear All'}
            </Text>
          </TouchableOpacity>
        </View>
        {!loading && !error && readReports.length === 0 ? (
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
