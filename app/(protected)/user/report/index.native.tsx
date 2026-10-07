import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Back from '@/src/components/mobile/Back';
import ScreenHeader from '@/src/components/mobile/ScreenHeader';
import icons from '@/src/constants/icons';
import { incidentManagementApi, type IncidentReport } from '@/src/lib/api/incidentManagement';
import { useFeatureGate } from '@/src/hooks/usePlan';
import { useUserStore } from '@/src/lib/stores/userStore';
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
  const role = useUserStore((state) => state.role);
  const isAdmin = role === 'admin' || role === 'primary_admin' || role === 'root';
  const { requestAccessWhenReady } = useFeatureGate('incident_report', { notice: 'floating' });
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState('');

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
      if (!isAdmin) return;
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
    }, [isAdmin, load, requestAccessWhenReady, router])
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
      setClearing(false);
    }
  };

  const newReports = reports.filter((report) => !report.is_read);
  const readReports = reports.filter((report) => report.is_read);

  if (!isAdmin) {
    return (
      <SafeAreaView
        style={[sharedStyles.container, { backgroundColor: '#F6F7F7' }]}
        edges={['top']}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <ScreenHeader title="Report" subtitle="Report incidents in your estate." />
        <View className="flex-1 items-center justify-center">
          <Text className="text-center text-sm font-inter-regular text-[#6C6C6C]">
            Incident reporting is coming soon.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[sharedStyles.container, { paddingTop: 29, backgroundColor: '#F6F7F7' }]}
      edges={['top']}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <Back type="short-arrow" showText={false} showBorder borderSize={30} leftOffset={-3} />
      <Text className="mt-[13px] ml-[4px] text-[27.34px] leading-[33px] text-[#113E55] font-ubuntu-medium">
        Incident Report
      </Text>
      <Text className="mt-[12px] ml-[3px] text-[14px] leading-[17px] text-[#878686] font-inter-light">
        View all reports observed in your space.
      </Text>
      <ScrollView
        className="flex-1"
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
        <View className="mx-[9px] min-h-[135px] gap-[1px]">
          {loading ? <ActivityIndicator color="#113E55" /> : null}
          {!loading && error ? (
            <Text className="text-[13px] text-[#B42318] font-inter-regular">{error}</Text>
          ) : null}
          {!loading && !error && newReports.length === 0 ? (
            <Text className="text-[13px] text-[#878686] font-inter-regular">No new reports.</Text>
          ) : null}
          {newReports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onPress={() =>
                router.push({ pathname: '/user/report/[id]', params: { id: report.id } })
              }
            />
          ))}
        </View>
        <View className="relative mx-[9px] mt-[15px] h-[39px]">
          <Text className="absolute left-[20px] top-[9px] text-[11.2px] leading-[14px] text-[#878686] font-inter-regular">
            Read Reports
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            className="absolute right-[9px] top-0 h-[40px] w-[46px] items-center justify-center"
            onPress={() => {
              void clearRead();
            }}
            disabled={clearing || readReports.length === 0}
          >
            <Text className="text-[11.2px] leading-[14px] text-[#113E55] font-inter-semibold">
              {clearing ? '…' : 'Clear All'}
            </Text>
          </TouchableOpacity>
        </View>
        {!loading && !error && readReports.length === 0 ? (
          <Text className="mx-[9px] text-[13px] text-[#878686] font-inter-regular">
            No read reports.
          </Text>
        ) : null}
        <View className="ml-[10px] mr-[8px] gap-[1px]">
          {readReports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onPress={() =>
                router.push({ pathname: '/user/report/[id]', params: { id: report.id } })
              }
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
