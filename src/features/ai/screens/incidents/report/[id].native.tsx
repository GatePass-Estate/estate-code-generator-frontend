import { useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CircleLoader } from '@/src/shared/components/feedback/ScreenLoading';
import { Ionicons } from '@expo/vector-icons';
import Back from '@/src/shared/components/navigation/Back';
import type { IncidentReport } from '@/src/features/ai/services/incidentManagement';
import ActionConfirmModal from '@/src/shared/components/feedback/ActionConfirmModal';
import {
  useManagedIncidentReport,
  useMarkIncidentReportRead,
} from '@/src/features/ai/hooks/operations';

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

function SenderRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <View>
      <Text className="text-[14px] leading-[20px] text-[#878686] font-inter-medium">{label} :</Text>
      <Text className="text-[14px] leading-[16px] text-[#0A1F29] font-inter-light">
        {value?.trim() || 'Not provided'}
      </Text>
    </View>
  );
}

export default function IncidentReportDetailScreen() {
  const { id, returnTo } = useLocalSearchParams<{ id?: string; returnTo?: string }>();
  const router = useRouter();
  const reportQuery = useManagedIncidentReport(id, 'all');
  const markReadMutation = useMarkIncidentReportRead();
  const report = id ? (reportQuery.data ?? null) : null;
  const loading = Boolean(id) && reportQuery.isLoading;
  const saving = markReadMutation.isPending;
  const [actionError, setActionError] = useState('');
  const loadError = !id
    ? 'Report not found.'
    : reportQuery.isError
      ? 'Unable to load this report. Please try again.'
      : '';
  const error = actionError || loadError;
  const [senderVisible, setSenderVisible] = useState(false);
  const [confirmMarkRead, setConfirmMarkRead] = useState(false);

  const { isFetched: reportFetched, refetch: refetchReport } = reportQuery;

  useFocusEffect(
    useCallback(() => {
      if (reportFetched) void refetchReport();
    }, [refetchReport, reportFetched])
  );

  const markRead = async () => {
    if (!id || saving) return;
    try {
      await markReadMutation.mutateAsync(id);
      setConfirmMarkRead(false);
      router.replace({ pathname: '/user/report', params: { returnTo: returnTo || '/admin' } });
    } catch {
      setConfirmMarkRead(false);
      setActionError('Unable to mark this report as read. Please try again.');
    }
  };

  const sender = report?.reporter;
  const senderName = [sender?.first_name, sender?.last_name].filter(Boolean).join(' ');

  return (
    <SafeAreaView className="flex-1 bg-[#F6F7F7]" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="px-5 pt-[19px]">
        <View className="relative h-[30px] flex-row items-center justify-between">
          <Back
            type="short-arrow"
            showText={false}
            showBorder
            borderSize={30}
            leftOffset={-3}
            onPress={() =>
              router.replace({
                pathname: '/user/report',
                params: { returnTo: returnTo || '/admin' },
              })
            }
          />
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => setSenderVisible(true)}
            disabled={!report}
            className="absolute -top-[3px] right-[6px] h-[40px] w-[112px] items-end justify-center"
          >
            <Text
              numberOfLines={1}
              className="text-right text-caption leading-[14px] text-primary font-inter-semibold"
            >
              Sender&apos;s Details
            </Text>
          </TouchableOpacity>
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
            <CircleLoader size={36} />
          </View>
        ) : null}
        {!loading && error ? (
          <Pressable
            onPress={() => {
              void reportQuery.refetch();
            }}
          >
            <Text className="text-[14px] text-[#B42318] font-inter-regular">{error}</Text>
          </Pressable>
        ) : null}
        {!loading && report ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            <Text className="text-[14px] leading-[20px] text-[#0A1F29] font-inter-light">
              {report.narrative}
            </Text>
          </ScrollView>
        ) : null}
      </View>

      {!loading && report && !report.is_read ? (
        <View className="h-[282px] items-center bg-[#F6F7F7] px-[48.5px] pt-[94px]">
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => setConfirmMarkRead(true)}
            disabled={saving}
            className="h-[48px] w-full items-center justify-center rounded-[24px] border border-[#0A1F29] bg-primary"
          >
            <Text className="text-[14px] leading-[14px] tracking-[-0.24px] text-[#F6F7F7] font-ubuntu-semibold">
              {saving ? 'Marking…' : 'Mark as Read'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <ActionConfirmModal
        visible={confirmMarkRead}
        title="Mark Report as Read?"
        message="This report will move from New Reports to Read Reports."
        confirmLabel="Mark as Read"
        busy={saving}
        onConfirm={() => void markRead()}
        onCancel={() => setConfirmMarkRead(false)}
      />

      <Modal
        visible={senderVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSenderVisible(false)}
      >
        <Pressable className="flex-1 bg-black/50" onPress={() => setSenderVisible(false)}>
          <Pressable
            className="mx-[31px] mt-[177px] h-[374px] rounded-[16px] bg-[#F6F7F7]"
            onPress={() => {}}
          >
            <Text className="absolute left-0 right-0 top-[56px] text-center text-heading-sm leading-[26px] text-[#878686] font-ubuntu-semibold">
              Report From
            </Text>
            <ScrollView
              className="absolute left-[21px] right-[21px] top-[105px] bottom-[25px]"
              contentContainerStyle={{ gap: 18, paddingBottom: 4 }}
              showsVerticalScrollIndicator={false}
            >
              <SenderRow label="Name" value={senderName} />
              <SenderRow label="Address" value={sender?.home_address} />
              <SenderRow label="Email Address" value={sender?.email} />
              <SenderRow label="Phone Number" value={sender?.phone_number} />
            </ScrollView>
          </Pressable>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Close sender details"
            className="absolute top-[679px] self-center"
            onPress={() => setSenderVisible(false)}
          >
            <Ionicons name="close-circle-outline" size={24} color="#F6F7F7" />
          </TouchableOpacity>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
