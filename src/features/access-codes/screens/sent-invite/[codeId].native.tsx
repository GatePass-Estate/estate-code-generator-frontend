import { useGoBack } from '@/src/shared/hooks/useGoBack';
import { useCallback, useMemo, useState } from 'react';
import ScreenLoading, { CircleLoader } from '@/src/shared/components/feedback/ScreenLoading';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useNavigation } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  UpcomingCalendarIcon,
  UpcomingProfileAvatar,
  UpcomingValidityWindowIcon,
} from '@/src/assets/svgs';
import ScreenHeader from '@/src/shared/components/layout/ScreenHeader';
import { useDeleteCode, useUpcomingCodes } from '@/src/features/access-codes/hooks/codes';
import { formatInviteClockTime, formatInviteScheduleDate } from '@/src/shared/utils/helpers';
import { useAndroidBottomInset } from '@/src/shared/hooks/useAndroidBottomInset';
import { useUserStore } from '@/src/store/userStore';
import { sharedStyles } from '@/src/shared/theme/styles';

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
      <Text className="text-caption font-inter-regular uppercase text-[#878686]">{label}</Text>
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
  const goBack = useGoBack();
  const navigation = useNavigation();
  const { tabBarStyle } = useAndroidBottomInset();
  const user_id = useUserStore((s) => s.user_id);
  const params = useLocalSearchParams<{
    codeId: string;
    visitorName?: string;
    relationship?: string;
  }>();

  const hashedCode = (Array.isArray(params.codeId) ? params.codeId[0] : params.codeId) ?? '';
  const upcomingQuery = useUpcomingCodes(user_id);
  const deleteCodeMutation = useDeleteCode();
  const [cancelling, setCancelling] = useState(false);
  const invite = useMemo(() => {
    const normalized = hashedCode.replace(/\s+/g, '').toUpperCase();
    return (
      (upcomingQuery.data?.items ?? []).find(
        (item) => item.hashed_code?.replace(/\s+/g, '').toUpperCase() === normalized
      ) ?? null
    );
  }, [hashedCode, upcomingQuery.data]);
  const loading = Boolean(hashedCode && user_id) && upcomingQuery.isLoading;
  const error =
    !hashedCode || !user_id
      ? 'Invite not found.'
      : upcomingQuery.isError
        ? upcomingQuery.error.message.trim() || 'Could not load invite.'
        : upcomingQuery.isSuccess && !invite
          ? 'Invite not found.'
          : null;

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
          tabBarStyle,
        });
      };
    }, [navigation, tabBarStyle])
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
            await deleteCodeMutation.mutateAsync(hashedCode);
            Alert.alert('Invite cancelled', 'The scheduled code has been removed.', [
              { text: 'OK', onPress: () => goBack() },
            ]);
          } catch {
            Alert.alert('Could not cancel', 'Please try again later.');
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  }, [cancelling, deleteCodeMutation, goBack, hashedCode]);

  return (
    <SafeAreaView style={[sharedStyles.container, { backgroundColor: '#F6F7F7' }]}>
      <ScreenHeader title="Upcoming Invite" onBack={() => navigation.goBack()} />

      {loading ? (
        <ScreenLoading />
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
                  primary={formatInviteScheduleDate(periodStart)}
                  secondary={formatInviteClockTime(periodStart)}
                />
                <DetailRow
                  label="End Date"
                  primary={formatInviteScheduleDate(periodEnd)}
                  secondary={formatInviteClockTime(periodEnd)}
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
                  <DetailRow label="Start Hour" primary={formatInviteClockTime(windowStart)} />
                  <DetailRow label="End Hour" primary={formatInviteClockTime(windowEnd)} />
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
                <CircleLoader size={22} tone="light" />
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
