import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams, useNavigation } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  FormChevronRightIcon,
  UpcomingCalendarIcon,
  UpcomingValidityWindowIcon,
  ValidityWindowArrowIcon,
} from '@/src/assets/svgs';
import Button, { BUTTON_MARGIN_BOTTOM } from '@/src/components/mobile/Button';
import CodeDateTimePicker from '@/src/components/mobile/CodeDateTimePicker';
import PlanNotice from '@/src/components/mobile/PlanNotice';
import ScreenHeader from '@/src/components/mobile/ScreenHeader';
import SetTimeSheet from '@/src/components/mobile/SetTimeSheet';
import ToggleSwitch from '@/src/components/mobile/ToggleSwitch';
import { generateCode } from '@/src/lib/api/codes';
import { createGuest } from '@/src/lib/api/guests';
import { formatInvitePeriodDisplay } from '@/src/lib/helpers';
import { useAndroidBottomInset } from '@/src/hooks/useAndroidBottomInset';
import { usePlan } from '@/src/hooks/usePlan';
import { useUserStore } from '@/src/lib/stores/userStore';
import { PLAN_FEATURES } from '@/src/lib/plans';
import { GenderType, RelationshipType } from '@/src/types/general';
import { sharedStyles } from '@/src/theme/styles';

type DateTarget = 'start' | 'end';

const formatDatePart = (date: Date) => {
  const weekday = date.toLocaleString('en-GB', { weekday: 'long' });
  const month = date.toLocaleString('en-GB', { month: 'long' });
  return `${weekday}, ${date.getDate()} ${month}`;
};

const formatClock = (date: Date) => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const formatDurationHours = (start: Date | null, end: Date | null) => {
  if (!start || !end || end.getTime() <= start.getTime()) return null;
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 3_600_000));
};

const atCurrentClock = () => {
  const d = new Date();
  d.setSeconds(0, 0);
  return d;
};

const oneHourLaterClock = () => {
  const d = atCurrentClock();
  d.setHours(d.getHours() + 1);
  return d;
};

/** Cache service expects ``YYYY-MM-DD HH:MM:SS.mmm+0000`` (UTC). */
const toBackendUtc = (date: Date) => {
  const pad = (n: number, len = 2) => String(n).padStart(len, '0');
  return (
    `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ` +
    `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}.` +
    `${pad(date.getUTCMilliseconds(), 3)}+0000`
  );
};

const RELATIONSHIPS = new Set([
  'partner',
  'friend',
  'family',
  'taxi',
  'delivery',
  'technician',
  'other',
]);
const GENDERS = new Set(['male', 'female', 'prefer_not_to_say']);

export default function SetAccessCodeDurationScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { tabBarStyle } = useAndroidBottomInset();
  const { user_id, estate_id, home_address, estate_name } = useUserStore();
  const { requestFeature } = usePlan();
  const params = useLocalSearchParams<{
    visitorName?: string;
    relationship?: string;
    gender?: string;
    saveGuest?: string;
  }>();

  const visitorName = params.visitorName?.trim() || 'Guest';
  const relationshipParam = params.relationship?.trim().toLowerCase() || 'other';
  const genderParam = params.gender?.trim().toLowerCase() || 'prefer_not_to_say';
  const relationship = (
    RELATIONSHIPS.has(relationshipParam) ? relationshipParam : 'other'
  ) as RelationshipType;
  const gender = (GENDERS.has(genderParam) ? genderParam : 'prefer_not_to_say') as GenderType;
  const shouldSaveGuest = params.saveGuest === 'true';

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

  const [durationEnabled, setDurationEnabled] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [windowEnabled, setWindowEnabled] = useState(false);
  const [windowStart, setWindowStart] = useState(atCurrentClock);
  const [windowEnd, setWindowEnd] = useState(oneHourLaterClock);
  const [dateTarget, setDateTarget] = useState<DateTarget | null>(null);
  const [timeSheetVisible, setTimeSheetVisible] = useState(false);
  const [generating, setGenerating] = useState(false);

  const durationHours = formatDurationHours(startDate, endDate);
  const windowTimesDiffer = formatClock(windowStart) !== formatClock(windowEnd);
  const customPeriodReady = Boolean(
    startDate && endDate && endDate.getTime() > startDate.getTime()
  );
  const canGenerate = Boolean(user_id && estate_id && durationEnabled && customPeriodReady);

  const datePickerValue = useMemo(() => {
    if (dateTarget === 'start') return startDate ?? new Date();
    if (dateTarget === 'end') return endDate ?? startDate ?? new Date();
    return new Date();
  }, [dateTarget, endDate, startDate]);

  const handleDurationToggle = (next: boolean) => {
    if (!next) {
      setDurationEnabled(false);
      return;
    }
    if (!requestFeature(PLAN_FEATURES.advanced_code_management)) return;
    setDurationEnabled(true);
    if (!startDate || !endDate) {
      const start = new Date();
      const end = new Date(start.getTime() + 3_600_000);
      setStartDate(start);
      setEndDate(end);
    }
  };

  const handleWindowToggle = (next: boolean) => {
    if (!next) {
      setWindowEnabled(false);
      return;
    }
    if (!requestFeature(PLAN_FEATURES.advanced_code_management)) return;
    setWindowEnabled(true);
  };

  const handleGenerate = useCallback(async () => {
    if (!canGenerate || !user_id || !startDate || !endDate) return;
    if (!requestFeature(PLAN_FEATURES.advanced_code_management)) return;
    if (windowEnabled && !requestFeature(PLAN_FEATURES.advanced_code_management)) return;

    const now = new Date();
    const start = startDate;
    const end = endDate;

    if (start.getTime() < now.getTime() - 30_000) {
      Alert.alert('Invalid start time', 'Start date/time cannot be in the past.');
      return;
    }

    const periodStart = start.getTime() < now.getTime() ? now : start;
    if (end.getTime() <= periodStart.getTime()) {
      Alert.alert('Invalid end time', 'End date/time must be after the start.');
      return;
    }

    setGenerating(true);
    try {
      const result = await generateCode(
        {
          user_id,
          estate_id: estate_id ?? '',
          visitor_fullname: visitorName,
          relationship_with_resident: relationship,
          gender,
          validity_period: {
            start: toBackendUtc(periodStart),
            end: toBackendUtc(end),
          },
          validity_window:
            windowEnabled && windowTimesDiffer
              ? {
                  start: formatClock(windowStart),
                  end: formatClock(windowEnd),
                }
              : null,
        },
        'visitor'
      );

      if (shouldSaveGuest) {
        try {
          await createGuest({
            resident_id: user_id,
            guest_name: visitorName,
            relationship,
            gender,
          });
        } catch (e) {
          console.log('Failed to save guest:', e);
        }
      }

      const { formattedDate, timeframe } = formatInvitePeriodDisplay(periodStart, end);
      router.push({
        pathname: '/invite',
        params: {
          code: result.hashed_code,
          name: visitorName,
          address: `${home_address ?? ''}, ${estate_name ?? ''}`.replace(/^,\s*|,\s*$/g, ''),
          timeframe,
          date: formattedDate,
        },
      });
    } catch (e: any) {
      Alert.alert('Could not generate code', e?.message?.trim() || 'Please try again later.');
    } finally {
      setGenerating(false);
    }
  }, [
    canGenerate,
    endDate,
    estate_id,
    estate_name,
    gender,
    home_address,
    relationship,
    requestFeature,
    shouldSaveGuest,
    startDate,
    user_id,
    visitorName,
    windowEnabled,
    windowEnd,
    windowStart,
    windowTimesDiffer,
  ]);

  if (dateTarget) {
    return (
      <CodeDateTimePicker
        mode={dateTarget}
        value={datePickerValue}
        minDate={dateTarget === 'end' ? startDate : null}
        onBack={() => setDateTarget(null)}
        onSet={(next) => {
          if (dateTarget === 'start') setStartDate(next);
          else setEndDate(next);
          setDateTarget(null);
        }}
      />
    );
  }

  return (
    <SafeAreaView
      style={[sharedStyles.container, sharedStyles.modalContainer, { backgroundColor: '#F6F7F7' }]}
      edges={['top']}
    >
      <Pressable
        onPress={() => navigation.goBack()}
        className="h-[30px] w-[30px] items-center justify-center rounded-full bg-[#EFF1F1]"
      >
        <MaterialIcons name="keyboard-arrow-left" size={24} color="#113E55" />
      </Pressable>

      <ScreenHeader
        title="Set Duration"
        titleClassName="text-[27.34px]"
        subtitle="Select the date and time duration of your guest access code."
        subtitleClassName="text-[#878686] mt-1"
        containerClassName="mt-[25px]"
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: 40,
          paddingBottom: BUTTON_MARGIN_BOTTOM + insets.bottom,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
      >
        <PlanSwitchRow
          icon={<UpcomingCalendarIcon width={16} height={16} />}
          label="Set Duration"
          value={durationEnabled}
          onValueChange={handleDurationToggle}
        />
        <Text className="mt-[9px] px-[11px] text-[11.2px] font-inter-regular text-[#9B9797]">
          Set the duration for which your guest’s access code will be active.
        </Text>

        {durationEnabled ? (
          <View className="mt-[30px]">
            <DateTimeRow
              date={startDate}
              placeholder="Enter Start Date"
              onPress={() => setDateTarget('start')}
            />

            <View className="mt-2 mb-4 flex-row items-center px-[41px]">
              <View className="h-px flex-1 bg-[#878686]/30" />
              <Text className="w-8 text-center text-[10px] font-ubuntu-medium tracking-[-0.24px] text-[#878686]">
                to
              </Text>
              <View className="h-px flex-1 bg-[#878686]/30" />
            </View>

            <DateTimeRow
              date={endDate}
              placeholder="Enter End Date"
              onPress={() => setDateTarget('end')}
            />

            <Text
              className={`mt-[9px] px-1 text-[11.2px] font-inter-regular ${
                durationHours != null ? 'text-[#F46036]' : 'text-[#878686]'
              }`}
            >
              {durationHours != null
                ? `Duration:  ${durationHours === 1 ? '1hour' : `${durationHours} hours`}`
                : 'Duration:  --'}
            </Text>
          </View>
        ) : null}

        <View className="mt-[30px]">
          <PlanSwitchRow
            icon={<UpcomingValidityWindowIcon width={16} height={16} />}
            label="Set Validity Window"
            value={windowEnabled}
            onValueChange={handleWindowToggle}
          />
          <Text className="mt-[9px] px-[11px] text-[11.2px] font-inter-regular text-[#9B9797]">
            Set the time frame for which your guest’s access code will be valid during the day
          </Text>
        </View>

        {windowEnabled ? (
          <Pressable
            onPress={() => setTimeSheetVisible(true)}
            className="mt-10 items-center rounded-2xl bg-white p-4"
            style={{ gap: 9 }}
          >
            <Text className="w-full text-center text-sm font-inter-medium text-[#878686]">
              Validity Window
            </Text>
            <View className="w-[217px] items-center px-4 py-2">
              <View className="w-[201px] flex-row items-center justify-between">
                <View className="w-[41px] items-center" style={{ gap: 6 }}>
                  <Text className="h-[14px] w-[77px] text-center text-[11.2px] font-inter-regular text-[#878686]">
                    START HOUR
                  </Text>
                  <Text
                    className="w-[107px] text-center font-ubuntu-medium text-[#113E55]"
                    style={{ fontSize: 34.18, lineHeight: 41 }}
                  >
                    {formatClock(windowStart)}
                  </Text>
                </View>
                <View className="h-[10px] w-[14px] items-center justify-center">
                  <ValidityWindowArrowIcon width={14} height={10} />
                </View>
                <View className="w-[41px] items-center" style={{ gap: 6 }}>
                  <Text className="w-[81px] text-center text-[11.2px] font-inter-regular text-[#878686]">
                    END HOUR
                  </Text>
                  <Text
                    className="w-[101px] text-center font-ubuntu-medium text-[#113E55]"
                    style={{ fontSize: 34.18, lineHeight: 41 }}
                  >
                    {formatClock(windowEnd)}
                  </Text>
                </View>
              </View>
            </View>
          </Pressable>
        ) : null}

        <View className="mt-auto items-center pt-10">
          <PlanNotice feature={PLAN_FEATURES.advanced_code_management} className="mb-8 w-full" />
          <Button
            label="Generate Code"
            loading={generating}
            disabled={!canGenerate}
            onPress={handleGenerate}
          />
        </View>
      </ScrollView>

      <SetTimeSheet
        visible={timeSheetVisible}
        start={windowStart}
        end={windowEnd}
        onClose={() => setTimeSheetVisible(false)}
        onDone={(nextStart, nextEnd) => {
          setWindowStart(nextStart);
          setWindowEnd(nextEnd);
          setTimeSheetVisible(false);
        }}
      />
    </SafeAreaView>
  );
}

function PlanSwitchRow({
  icon,
  label,
  value,
  onValueChange,
}: {
  icon: ReactNode;
  label: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
}) {
  return (
    <View className="flex-row items-center justify-between rounded-2xl bg-white px-4 py-3">
      <View className="flex-1 flex-row items-center gap-4">
        {icon}
        <Text className="text-sm font-inter-light text-[#878686]">{label}</Text>
      </View>
      <ToggleSwitch value={value} onValueChange={onValueChange} />
    </View>
  );
}

function DateTimeRow({
  date,
  placeholder,
  onPress,
}: {
  date: Date | null;
  placeholder: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between rounded-[8px] bg-white px-4 py-3"
    >
      <View className="min-w-0 flex-1 flex-row items-center gap-4">
        <UpcomingCalendarIcon width={16} height={16} />
        {date ? (
          <Text className="flex-1 text-sm font-inter-light text-[#113E55]" numberOfLines={1}>
            {formatDatePart(date)}
          </Text>
        ) : (
          <Text className="flex-1 text-sm font-inter-light text-[#878686]">{placeholder}</Text>
        )}
      </View>
      <View className="ml-2 flex-row items-center">
        {date ? (
          <Text className="mr-1 text-sm font-inter-medium text-[#113E55]">{formatClock(date)}</Text>
        ) : null}
        <FormChevronRightIcon width={20} height={20} />
      </View>
    </Pressable>
  );
}
