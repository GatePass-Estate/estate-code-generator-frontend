import { useCallback, useState } from 'react';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import Back from '@/src/components/mobile/Back';
import icons from '@/src/constants/icons';
import { useFeatureGate } from '@/src/hooks/usePlan';
import { incidentManagementApi, type IncidentReport } from '@/src/lib/api/incidentManagement';
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

export default function MyIncidentReportsScreen() {
  const router = useRouter();
  const { returnTo: returnToParam } = useLocalSearchParams<{ returnTo?: string }>();
  const returnTo = parseIncidentReportReturnTo(returnToParam);
  const { requestAccessWhenReady } = useFeatureGate('incident_report', { notice: 'floating' });
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setReports(await incidentManagementApi.listMyAll());
      setError('');
    } catch {
      setError('Unable to load your reports. Pull down to try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return;
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        leaveIncidentReport(returnTo, router);
        return true;
      });
      return () => subscription.remove();
    }, [returnTo, router])
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        const allowed = await requestAccessWhenReady(() => active);
        if (!active) return;
        if (allowed) {
          setCheckingAccess(false);
          await load();
        } else router.replace('/user');
      })();
      return () => {
        active = false;
      };
    }, [load, requestAccessWhenReady, router])
  );

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
        <View className="mt-[36px] mx-[9px] gap-[1px]">
          {checkingAccess || loading ? <ActivityIndicator color="#113E55" /> : null}
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
                  pathname: '/user/report/mine/[id]',
                  params: { id: report.id, returnTo },
                })
              }
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
