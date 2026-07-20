import { useCallback, useEffect, useState } from 'react';
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
import { deleteCode, getAllCodes } from '@/src/lib/api/codes';
import { parseLogDate } from '@/src/lib/helpers';
import { useAndroidBottomInset } from '@/src/hooks/useAndroidBottomInset';
import { useUserStore } from '@/src/lib/stores/userStore';
import { Codes } from '@/src/types/codes';
import { sharedStyles } from '@/src/theme/styles';

/** Format calendar date from API UTC datetimes (e.g. ``2026-07-25 14:00:00.000+0000``). */
const formatScheduleDate = (value?: string | null) => {
  if (!value) return '—';
  const date = parseLogDate(value);
  if (Number.isNaN(date.getTime())) return value;
  const weekday = date.toLocaleString('en-GB', { weekday: 'long', timeZone: 'UTC' });
  const day = date.getUTCDate();
  const month = date.toLocaleString('en-GB', { month: 'long', timeZone: 'UTC' });
  const year = date.getUTCFullYear();
  return `${weekday}, ${day} ${month} ${year}`;
};

/** Clock time: keep ``HH:MM`` windows as-is; format datetimes in UTC to match API. */
const formatTime = (value?: string | null) => {
  if (!value) return '—';
  const trimmed = value.trim();
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(trimmed)) {
    const [h, m] = trimmed.split(':');
    return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
  }
  const date = parseLogDate(trimmed);
  if (Number.isNaN(date.getTime())) return trimmed;
  return `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`;
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
  const { user_id } = useUserStore();
  const params = useLocalSearchParams<{
    codeId: string;
    visitorName?: string;
    relationship?: string;
  }>();

  const hashedCode = (Array.isArray(params.codeId) ? params.codeId[0] : params.codeId) ?? '';
  const [invite, setInvite] = useState<Codes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const visitorName = capitalizeWords(
    invite?.visitor_fullname?.trim() || params.visitorName?.trim() || 'Guest'
  );
  const relationship = capitalizeWords(
    invite?.relationship_with_resident?.trim() || params.relationship?.trim() || 'Other'
  );
  const periodStart = invite?.validity_period?.start || invite?.valid_until || '';
  const periodEnd = invite?.validity_period?.end || invite?.valid_until || '';
  const windowStart = invite?.validity_window?.start || '';
  const windowEnd = invite?.validity_window?.end || '';

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

  const fetchInvite = useCallback(async () => {
    if (!hashedCode || !user_id) {
      setError('Invite not found.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await getAllCodes(user_id);
      const match =
        (result.items ?? []).find(
          (item) =>
            item.hashed_code?.replace(/\s+/g, '').toUpperCase() ===
            hashedCode.replace(/\s+/g, '').toUpperCase()
        ) ?? null;

      if (!match) {
        setInvite(null);
        setError('Invite not found.');
      } else {
        setInvite(match);
      }
    } catch (e: any) {
      setInvite(null);
      setError(e?.message?.trim() || 'Could not load invite.');
    } finally {
      setLoading(false);
    }
  }, [hashedCode, user_id]);

  useEffect(() => {
    fetchInvite();
  }, [fetchInvite]);

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

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#113E55" />
        </View>
      ) : error ? (
        <Text className="mt-8 text-center text-sm font-inter-regular text-[#6C6C6C]">{error}</Text>
      ) : (
        <>
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
                  <Text className="text-sm font-inter-medium text-[#0A1F29]">
                    Code Scheduled for :
                  </Text>
                </View>
                <DetailRow
                  label="Start Date"
                  primary={formatScheduleDate(periodStart)}
                  secondary={formatTime(periodStart)}
                />
                <DetailRow
                  label="End Date"
                  primary={formatScheduleDate(periodEnd)}
                  secondary={formatTime(periodEnd)}
                />
              </View>
            </View>

            {windowStart || windowEnd ? (
              <View className="rounded-[16px] bg-white p-4 gap-[11px] flex-row items-start">
                <UpcomingValidityWindowIcon width={24} height={24} />
                <View className="flex-1 flex-col gap-[17px]">
                  <View className="flex-row items-center gap-[11px]">
                    <Text className="text-sm font-inter-medium text-[#0A1F29]">
                      Validity Window
                    </Text>
                  </View>
                  <DetailRow label="Start Hour" primary={formatTime(windowStart)} />
                  <DetailRow label="End Hour" primary={formatTime(windowEnd)} />
                </View>
              </View>
            ) : null}
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
        </>
      )}
    </SafeAreaView>
  );
}
