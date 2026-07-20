import { useCallback, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useNavigation, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  UpcomingCalendarIcon,
  UpcomingProfileAvatar,
  UpcomingValidityWindowIcon,
} from '@/src/assets/svgs';
import ScreenHeader from '@/src/components/mobile/ScreenHeader';
import { deleteCode } from '@/src/lib/api/codes';
import { useAndroidBottomInset } from '@/src/hooks/useAndroidBottomInset';
import { sharedStyles } from '@/src/theme/styles';

const parseDate = (value: string) => {
  if (!value) return null;
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(value.trim())) return null;
  const iso = value.replace(' ', 'T').replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatScheduleDate = (value?: string) => {
  if (!value) return '—';
  const date = parseDate(value);
  if (!date) return value;
  const weekday = date.toLocaleString('en-GB', { weekday: 'long' });
  const day = date.getDate();
  const month = date.toLocaleString('en-GB', { month: 'long' });
  const year = date.getFullYear();
  return `${weekday}, ${day} ${month} ${year}`;
};

const formatTime = (value?: string) => {
  if (!value) return '—';
  const trimmed = value.trim();
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(trimmed)) {
    const [h, m] = trimmed.split(':');
    return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
  }
  const date = parseDate(trimmed);
  if (!date) return trimmed;
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const capitalizeWords = (value: string) =>
  value
    ? value
        .split(' ')
        .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ''))
        .join(' ')
    : '';

function DetailRow({
  label,
  primary,
  secondary,
}: {
  label: string;
  primary: string;
  secondary?: string;
}) {
  return (
    <View className="w-full">
      <Text className="text-[11.2px] font-inter-regular uppercase text-[#878686]">{label}</Text>
      <View className="mt-1.5 w-full flex-row items-center justify-between">
        <Text className="flex-1 pr-3 text-sm font-inter-light text-[#0A1F29]">{primary}</Text>
        {secondary ? (
          <Text className="text-sm font-inter-light text-[#0A1F29]">{secondary}</Text>
        ) : null}
      </View>
    </View>
  );
}

export default function UpcomingInviteScreen() {
  const navigation = useNavigation();
  const { systemBottom, tabBarHeight } = useAndroidBottomInset();
  const params = useLocalSearchParams<{
    codeId: string;
    visitorName?: string;
    relationship?: string;
    periodStart?: string;
    periodEnd?: string;
    windowStart?: string;
    windowEnd?: string;
  }>();

  const hashedCode = params.codeId ?? '';
  const visitorName = capitalizeWords(params.visitorName?.trim() || 'Guest');
  const relationship = capitalizeWords(params.relationship?.trim() || 'Other');
  const [cancelling, setCancelling] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();
      parent?.setOptions({
        tabBarStyle: { display: 'none' },
      });

      return () => {
        parent?.setOptions({
          tabBarStyle: [
            sharedStyles.tabBar,
            Platform.OS === 'android' && {
              bottom: systemBottom,
              height: tabBarHeight,
            },
          ],
        });
      };
    }, [navigation, systemBottom, tabBarHeight])
  );

  const handleCancel = useCallback(() => {
    if (!hashedCode || cancelling) return;

    Alert.alert('Cancel Scheduling', 'Are you sure you want to cancel this upcoming invite?', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel Scheduling',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          try {
            await deleteCode(hashedCode);
            Alert.alert('Invite cancelled', 'The scheduled code has been removed.', [
              { text: 'OK', onPress: () => router.back() },
            ]);
          } catch {
            Alert.alert('Could not cancel', 'Please try again later.');
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  }, [cancelling, hashedCode]);

  return (
    <SafeAreaView
      style={[sharedStyles.container, sharedStyles.modalContainer, { backgroundColor: '#F6F7F7' }]}
    >
      <Pressable
        onPress={() => navigation.goBack()}
        className="h-[30px] w-[30px] items-center justify-center rounded-full bg-[#EFF1F1]"
      >
        <MaterialIcons name="keyboard-arrow-left" size={24} color="#113E55" />
      </Pressable>

      <ScreenHeader title="Upcoming Invite" containerClassName="mt-[35px]" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 24, paddingBottom: 120, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center gap-4 rounded-[16px] bg-white px-4 py-2">
          <UpcomingProfileAvatar width={20} height={20} />
          <View className="flex-1">
            <Text className="text-sm font-inter-medium text-[#0A1F29]">{visitorName}</Text>
            <Text className="mt-1 text-sm font-inter-light text-[#878686]">{relationship}</Text>
          </View>
        </View>

        <View className="rounded-[16px] bg-white p-4 flex-row gap-[11px]">
          <UpcomingCalendarIcon width={20} height={20} />
          <View className="flex-1 flex-col gap-[17px]">
            <View className="flex-row items-center gap-[11px]">
              <Text className="text-sm font-inter-medium text-[#0A1F29]">Code Scheduled for :</Text>
            </View>
            <DetailRow
              label="Start Date"
              primary={formatScheduleDate(params.periodStart)}
              secondary={formatTime(params.periodStart)}
            />
            <DetailRow
              label="End Date"
              primary={formatScheduleDate(params.periodEnd)}
              secondary={formatTime(params.periodEnd)}
            />
          </View>
        </View>

        <View className="rounded-[16px] bg-white p-4 gap-[11px] flex-row items-start">
          <UpcomingValidityWindowIcon width={24} height={24} />
          <View className="flex-1 flex-col gap-[17px]">
            <View className="flex-row items-center gap-[11px]">
              <Text className="text-sm font-inter-medium text-[#0A1F29]">Validity Window</Text>
            </View>
            <DetailRow label="Start Hour" primary={formatTime(params.windowStart)} />
            <DetailRow label="End Hour" primary={formatTime(params.windowEnd)} />
          </View>
        </View>
      </ScrollView>

      <View className="absolute bottom-[60px] left-5 right-5">
        <Pressable
          onPress={handleCancel}
          disabled={cancelling || !hashedCode}
          className="items-center justify-center rounded-full bg-primary p-4"
        >
          {cancelling ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-sm font-ubuntu-semibold text-white">Cancel Scheduling</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
