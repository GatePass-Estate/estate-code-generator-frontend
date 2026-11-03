import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
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
import { PlanNoticeSlot } from '@/src/components/mobile/FreePlanNotice';
import ScreenHeader from '@/src/components/mobile/ScreenHeader';
import SetTimeSheet from '@/src/components/mobile/SetTimeSheet';
import ToggleSwitch from '@/src/components/mobile/ToggleSwitch';
import { generateCode } from '@/src/lib/api/codes';
import { createGuest } from '@/src/lib/api/guests';
import { formatInvitePeriodDisplay, parseLogDate } from '@/src/lib/helpers';
import { useAndroidBottomInset } from '@/src/hooks/useAndroidBottomInset';
import { useFeatureGate } from '@/src/hooks/usePlan';
import { useUserStore } from '@/src/lib/stores/userStore';
import { GenderType, RelationshipType } from '@/src/types/general';
import { sharedStyles } from '@/src/theme/styles';

type DateTarget = 'start' | 'end';

const weekdayFormatter = new Intl.DateTimeFormat(undefined, { weekday: 'long' });
const monthFormatter = new Intl.DateTimeFormat(undefined, { month: 'long' });

const formatDatePart = (date: Date) =>
  `${weekdayFormatter.format(date)}, ${date.getDate()} ${monthFormatter.format(date)}`;

const formatClock = (date: Date) => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const HOUR_MS = 3_600_000;
/** Server rejects start <= now; cover clock skew and request latency. */
const START_NOW_BUFFER_MS = 5_000;

/** Drop seconds so a wheel pick of 11:43 is not treated as the past at 11:43:31. */
const atMinute = (date: Date) => {
  const next = new Date(date);
  next.setSeconds(0, 0);
  return next.getTime();
};

const formatDurationHours = (start: Date | null, end: Date | null) => {
  if (!start || !end || end.getTime() <= start.getTime()) return null;
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / HOUR_MS));
};

type Period = { start: Date; end: Date };
type PeriodResult = { period: Period } | { error: { title: string; message: string } };

const resolveCustomPeriod = (start: Date | null, end: Date | null, now: Date): PeriodResult => {
  if (!start || !end) {
    return { error: { title: 'Missing duration', message: 'Select a start and end date/time.' } };
  }
  if (atMinute(start) < atMinute(now)) {
    return {
      error: { title: 'Invalid start time', message: 'Start date/time cannot be in the past.' },
    };
  }
  // This minute / "now" must be strictly after the server clock, not 11:43:00 vs 11:43:40.
  const periodStart =
    start.getTime() <= now.getTime() + START_NOW_BUFFER_MS
      ? new Date(now.getTime() + START_NOW_BUFFER_MS)
      : start;
  if (end.getTime() <= periodStart.getTime()) {
    return {
      error: { title: 'Invalid end time', message: 'End date/time must be after the start.' },
    };
  }
  return { period: { start: periodStart, end } };
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

/**
 * Cache service expects ``YYYY-MM-DD HH:MM:SS.mmm+0000``.
 * Digits are local wall time (14:32 stays 14:32). Do not convert to UTC.
 */
const toBackendUtc = (date: Date) => {
  const pad = (n: number, len = 2) => String(n).padStart(len, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.` +
    `${pad(date.getMilliseconds(), 3)}+0000`
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
  const { requestAccess: requestCodeAccess, noticeProps: codeNoticeProps } = useFeatureGate(
    'advanced_code_management'
  );
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
  // "Now" is resolved when the code is generated, so a start picked earlier can't have passed.
  const [startNow, setStartNow] = useState(true);
  const [endDate, setEndDate] = useState<Date | null>(null);
  // Until the user picks an end, a start-now duration is "an hour from now" and follows the clock.
  const [endEdited, setEndEdited] = useState(false);
  const [windowEnabled, setWindowEnabled] = useState(false);
  const [windowStart, setWindowStart] = useState(atCurrentClock);
  const [windowEnd, setWindowEnd] = useState(oneHourLaterClock);
  // Until the user picks times, the window is "from now for an hour" and follows the clock.
  const [windowEdited, setWindowEdited] = useState(false);
  const [dateTarget, setDateTarget] = useState<DateTarget | null>(null);
  const [timeSheetVisible, setTimeSheetVisible] = useState(false);
  const [generating, setGenerating] = useState(false);

  const effectiveStart = startNow ? new Date() : startDate;
  const durationHours = formatDurationHours(effectiveStart, endDate);
  const windowTimesDiffer = formatClock(windowStart) !== formatClock(windowEnd);
  const usesValidityWindow = windowEnabled && windowTimesDiffer;
  const canGenerate = Boolean(user_id && estate_id);

  const datePickerValue = useMemo(() => {
    if (dateTarget === 'start') return (startNow ? null : startDate) ?? new Date();
    if (dateTarget === 'end') return endDate ?? (startNow ? null : startDate) ?? new Date();
    return new Date();
  }, [dateTarget, endDate, startDate, startNow]);

  useEffect(() => {
    // Paused while the time sheet is open: it re-reads these values and would reset a pick.
    if (!windowEnabled || windowEdited || timeSheetVisible) return;
    const sync = () => {
      const start = atCurrentClock();
      const end = oneHourLaterClock();
      setWindowStart((prev) => (formatClock(prev) === formatClock(start) ? prev : start));
      setWindowEnd((prev) => (formatClock(prev) === formatClock(end) ? prev : end));
    };
    sync();
    const id = setInterval(sync, 5_000);
    return () => clearInterval(id);
  }, [windowEnabled, windowEdited, timeSheetVisible]);

  useEffect(() => {
    if (!durationEnabled || !startNow || endEdited || dateTarget) return;
    const sync = () => {
      const next = new Date(Date.now() + HOUR_MS);
      setEndDate((prev) => (prev && formatClock(prev) === formatClock(next) ? prev : next));
    };
    sync();
    const id = setInterval(sync, 5_000);
    return () => clearInterval(id);
  }, [durationEnabled, startNow, endEdited, dateTarget]);

  const handleDurationToggle = (next: boolean) => {
    if (!next) {
      setDurationEnabled(false);
      return;
    }
    if (!requestCodeAccess()) return;
    setDurationEnabled(true);
    setStartNow(true);
    setEndEdited(false);
    if (!startDate || !endDate) {
      const start = new Date();
      const end = new Date(start.getTime() + HOUR_MS);
      setStartDate(start);
      setEndDate(end);
    }
  };

  const handleWindowToggle = (next: boolean) => {
    if (!next) {
      setWindowEnabled(false);
      return;
    }
    if (!requestCodeAccess()) return;
    setWindowEnabled(true);
  };

  const handleGenerate = useCallback(async () => {
    if (!user_id || !estate_id) return;
    // The plan may have changed since the toggles were switched on.
    if ((durationEnabled || usesValidityWindow) && !requestCodeAccess()) return;

    const now = new Date();
    let customPeriod: Period | null = null;
    if (durationEnabled) {
      const end = startNow && !endEdited ? new Date(now.getTime() + HOUR_MS) : endDate;
      const resolved = resolveCustomPeriod(startNow ? now : startDate, end, now);
      if ('error' in resolved) {
        Alert.alert(resolved.error.title, resolved.error.message);
        return;
      }
      customPeriod = resolved.period;
    }

    setGenerating(true);
    try {
      const result = await generateCode(
        {
          user_id,
          estate_id,
          visitor_fullname: visitorName,
          relationship_with_resident: relationship,
          gender,
          validity_period: customPeriod
            ? { start: toBackendUtc(customPeriod.start), end: toBackendUtc(customPeriod.end) }
            : null,
          validity_window: usesValidityWindow
            ? {
                start: formatClock(windowEdited ? windowStart : atCurrentClock()),
                end: formatClock(windowEdited ? windowEnd : oneHourLaterClock()),
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

      const { formattedDate, timeframe } = formatInvitePeriodDisplay(
        customPeriod?.start ?? now,
        customPeriod?.end ?? parseLogDate(result.valid_until)
      );
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
    durationEnabled,
    endDate,
    endEdited,
    estate_id,
    estate_name,
    gender,
    home_address,
    relationship,
    requestCodeAccess,
    shouldSaveGuest,
    startDate,
    startNow,
    user_id,
    usesValidityWindow,
    visitorName,
    windowEdited,
    windowEnd,
    windowStart,
  ]);

  if (dateTarget) {
    return (
      <CodeDateTimePicker
        mode={dateTarget}
        value={datePickerValue}
        minDate={dateTarget === 'end' ? effectiveStart : null}
        onBack={() => setDateTarget(null)}
        onSet={(next) => {
          const target = dateTarget;
          setDateTarget(null);
          requestAnimationFrame(() => {
            if (target === 'start') {
              setStartDate(next);
              setStartNow(false);
            } else {
              setEndEdited(true);
              setEndDate(next);
            }
          });
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
              isNow={startNow}
              placeholder="Enter Start Date"
              onPress={() => setDateTarget('start')}
            />
            {!startNow ? (
              <Pressable
                onPress={() => setStartNow(true)}
                className="mt-2 self-end rounded-full bg-[#E5F6FF] px-3 py-1.5"
              >
                <Text className="text-[11.2px] font-inter-medium text-[#113E55]">Start now</Text>
              </Pressable>
            ) : null}

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

        <View className="mt-auto w-full pt-10">
          <PlanNoticeSlot {...codeNoticeProps}>
            <View className="items-center">
              <Button
                label="Generate Code"
                loading={generating}
                disabled={!canGenerate}
                onPress={handleGenerate}
              />
            </View>
          </PlanNoticeSlot>
        </View>
      </ScrollView>

      <SetTimeSheet
        visible={timeSheetVisible}
        start={windowStart}
        end={windowEnd}
        onClose={() => setTimeSheetVisible(false)}
        onDone={(nextStart, nextEnd) => {
          setTimeSheetVisible(false);
          requestAnimationFrame(() => {
            setWindowEdited(true);
            setWindowStart(nextStart);
            setWindowEnd(nextEnd);
          });
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
  isNow = false,
}: {
  date: Date | null;
  placeholder: string;
  onPress: () => void;
  /** Shows "Now" instead of a date (the start is the moment the code is generated). */
  isNow?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between rounded-[8px] bg-white px-4 py-3"
    >
      <View className="min-w-0 flex-1 flex-row items-center gap-4">
        <UpcomingCalendarIcon width={16} height={16} />
        {isNow ? (
          <Text className="flex-1 text-sm font-inter-medium text-[#113E55]">Now</Text>
        ) : date ? (
          <Text className="flex-1 text-sm font-inter-light text-[#113E55]" numberOfLines={1}>
            {formatDatePart(date)}
          </Text>
        ) : (
          <Text className="flex-1 text-sm font-inter-light text-[#878686]">{placeholder}</Text>
        )}
      </View>
      <View className="ml-2 flex-row items-center">
        {date && !isNow ? (
          <Text className="mr-1 text-sm font-inter-medium text-[#113E55]">{formatClock(date)}</Text>
        ) : null}
        <FormChevronRightIcon width={20} height={20} />
      </View>
    </Pressable>
  );
}
