import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Back from '@/src/components/mobile/Back';
import { incidentManagementApi, type IncidentReport } from '@/src/lib/api/incidentManagement';

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

function SenderRow({ label, value, top }: { label: string; value?: string | null; top: number }) {
  return (
    <View className="absolute left-[21px] right-[21px]" style={{ top }}>
      <Text className="text-[14px] leading-[20px] text-[#878686] font-inter-medium">{label} :</Text>
      <Text className="text-[14px] leading-[16px] text-[#0A1F29] font-inter-light">
        {value?.trim() || 'Not provided'}
      </Text>
    </View>
  );
}

export default function IncidentReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const [report, setReport] = useState<IncidentReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [senderVisible, setSenderVisible] = useState(false);

  const load = useCallback(async () => {
    if (!id) {
      setError('Report not found.');
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setReport(await incidentManagementApi.get(id));
      setError('');
    } catch {
      setError('Unable to load this report. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const markRead = async () => {
    if (!id || saving) return;
    setSaving(true);
    try {
      await incidentManagementApi.markRead(id);
      router.back();
    } catch {
      setError('Unable to mark this report as read. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const sender = report?.reporter;
  const senderName = [sender?.first_name, sender?.last_name].filter(Boolean).join(' ');

  return (
    <SafeAreaView className="flex-1 bg-[#F6F7F7]" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="px-5 pt-[29px]">
        <View className="relative h-[30px] flex-row items-center justify-between">
          <Back type="short-arrow" showText={false} showBorder borderSize={30} leftOffset={-3} />
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => setSenderVisible(true)}
            disabled={!report}
            className="absolute -top-[3px] right-[6px] h-[40px] w-[112px] items-end justify-center"
          >
            <Text
              numberOfLines={1}
              className="text-right text-[11.2px] leading-[14px] text-[#113E55] font-inter-semibold"
            >
              Sender&apos;s Details
            </Text>
          </TouchableOpacity>
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
          <Pressable
            onPress={() => {
              void load();
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
            <Text className="text-[14px] leading-[14px] text-[#0A1F29] font-inter-light">
              {report.narrative}
            </Text>
          </ScrollView>
        ) : null}
      </View>

      {!loading && report && !report.is_read ? (
        <View className="h-[282px] items-center bg-[#F6F7F7] px-[48.5px] pt-[94px]">
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => {
              void markRead();
            }}
            disabled={saving}
            className="h-[48px] w-full items-center justify-center rounded-[24px] border border-[#0A1F29] bg-[#113E55]"
          >
            <Text className="text-[14px] leading-[14px] tracking-[-0.24px] text-[#F6F7F7] font-ubuntu-semibold">
              {saving ? 'Marking…' : 'Mark as Read'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

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
            <Text className="absolute left-0 right-0 top-[56px] text-center text-[21.88px] leading-[26px] text-[#878686] font-ubuntu-semibold">
              Report From
            </Text>
            <SenderRow label="Name" value={senderName} top={105} />
            <SenderRow label="Address" value={sender?.home_address} top={158} />
            <SenderRow label="Email Address" value={sender?.email} top={230} />
            <SenderRow label="Phone Number" value={sender?.phone_number} top={283} />
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
