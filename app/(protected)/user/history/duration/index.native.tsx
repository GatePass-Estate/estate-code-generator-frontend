import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Switch,
  Modal,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams, useNavigation } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  FormChevronRightIcon,
  UpcomingCalendarIcon,
  UpcomingValidityWindowIcon,
} from '@/src/assets/svgs';
import ScreenHeader from '@/src/components/mobile/ScreenHeader';
import { generateCode } from '@/src/lib/api/codes';
import { timeCalc } from '@/src/lib/helpers';
import { useAndroidBottomInset } from '@/src/hooks/useAndroidBottomInset';
import { useUserStore } from '@/src/lib/stores/userStore';
import { GenderType, RelationshipType } from '@/src/types/general';
import { sharedStyles } from '@/src/theme/styles';

type PickerTarget = 'startDate' | 'endDate' | 'windowStart' | 'windowEnd' | null;
type AndroidStep = 'date' | 'time';

const startOfDay = (date: Date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const formatDateLabel = (date: Date | null, placeholder: string) => {
  if (!date) return placeholder;
  const weekday = date.toLocaleString('en-GB', { weekday: 'short' });
  const day = date.getDate();
  const month = date.toLocaleString('en-GB', { month: 'long' });
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${weekday}, ${day} ${month} ${year}  ${hours}:${minutes}`;
};

const formatDayHeading = (date: Date) => {
  const weekday = date.toLocaleString('en-GB', { weekday: 'short' });
  const day = date.getDate();
  const month = date.toLocaleString('en-GB', { month: 'long' });
  return `${weekday}, ${day} ${month}`;
};

const formatClock = (date: Date) => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const formatDuration = (start: Date | null, end: Date | null) => {
  if (!start || !end || end.getTime() <= start.getTime()) return '--';
  const diffMs = end.getTime() - start.getTime();
  const totalMinutes = Math.round(diffMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes || parts.length === 0) parts.push(`${minutes}m`);
  return parts.join(' ');
};

const enumerateDays = (start: Date, end: Date) => {
  const days: Date[] = [];
  const cursor = startOfDay(start);
  const last = startOfDay(end);
  while (cursor.getTime() <= last.getTime()) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
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
  const { systemBottom, tabBarHeight } = useAndroidBottomInset();
  const { user_id, estate_id, home_address, estate_name } = useUserStore();
  const params = useLocalSearchParams<{
    visitorName?: string;
    relationship?: string;
    gender?: string;
  }>();

  const visitorName = params.visitorName?.trim() || 'Guest';
  const relationshipParam = params.relationship?.trim().toLowerCase() || 'other';
  const genderParam = params.gender?.trim().toLowerCase() || 'prefer_not_to_say';
  const relationship = (
    RELATIONSHIPS.has(relationshipParam) ? relationshipParam : 'other'
  ) as RelationshipType;
  const gender = (GENDERS.has(genderParam) ? genderParam : 'prefer_not_to_say') as GenderType;

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

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [windowEnabled, setWindowEnabled] = useState(false);
  const [windowStart, setWindowStart] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [windowEnd, setWindowEnd] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [androidStep, setAndroidStep] = useState<AndroidStep>('date');
  const [androidDraft, setAndroidDraft] = useState<Date | null>(null);
  const [generating, setGenerating] = useState(false);

  const daysInRange = useMemo(() => {
    if (!startDate || !endDate || endDate.getTime() <= startDate.getTime()) return [];
    return enumerateDays(startDate, endDate);
  }, [endDate, startDate]);

  const canGenerate = Boolean(
    startDate && endDate && endDate.getTime() > startDate.getTime() && user_id && estate_id
  );

  const pickerValue = useMemo(() => {
    if (Platform.OS === 'android' && androidStep === 'time' && androidDraft) return androidDraft;
    if (pickerTarget === 'startDate') return startDate ?? new Date();
    if (pickerTarget === 'endDate') return endDate ?? startDate ?? new Date();
    if (pickerTarget === 'windowStart') return windowStart;
    if (pickerTarget === 'windowEnd') return windowEnd;
    return new Date();
  }, [androidDraft, androidStep, endDate, pickerTarget, startDate, windowEnd, windowStart]);

  const isWindowPicker = pickerTarget === 'windowStart' || pickerTarget === 'windowEnd';
  const pickerMode =
    Platform.OS === 'ios'
      ? isWindowPicker
        ? 'time'
        : 'datetime'
      : isWindowPicker || androidStep === 'time'
        ? 'time'
        : 'date';

  const openPicker = (target: Exclude<PickerTarget, null>) => {
    setAndroidStep('date');
    setAndroidDraft(null);
    setPickerTarget(target);
  };

  const closePicker = () => {
    setPickerTarget(null);
    setAndroidStep('date');
    setAndroidDraft(null);
  };

  const applyPickerValue = (target: Exclude<PickerTarget, null>, selected: Date) => {
    if (target === 'startDate') {
      setStartDate(selected);
      setWindowStart(selected);
    }
    if (target === 'endDate') {
      setEndDate(selected);
      setWindowEnd(selected);
    }
    if (target === 'windowStart') setWindowStart(selected);
    if (target === 'windowEnd') setWindowEnd(selected);
  };

  const onPickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (!pickerTarget) return;

    if (Platform.OS === 'android') {
      if (event.type === 'dismissed') {
        closePicker();
        return;
      }
      if (!selected) return;

      if (isWindowPicker) {
        applyPickerValue(pickerTarget, selected);
        closePicker();
        return;
      }

      if (androidStep === 'date') {
        setAndroidDraft(selected);
        setAndroidStep('time');
        return;
      }

      const base = androidDraft ?? selected;
      const merged = new Date(base);
      merged.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      applyPickerValue(pickerTarget, merged);
      closePicker();
      return;
    }

    if (!selected) return;
    applyPickerValue(pickerTarget, selected);
  };

  const handleGenerate = useCallback(async () => {
    if (!canGenerate || !startDate || !endDate || !user_id) return;

    const now = new Date();
    if (startDate.getTime() < now.getTime() - 30_000) {
      Alert.alert('Invalid start time', 'Start date/time cannot be in the past.');
      return;
    }

    const periodStart = startDate.getTime() < now.getTime() ? now : startDate;
    if (endDate.getTime() <= periodStart.getTime()) {
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
            end: toBackendUtc(endDate),
          },
          validity_window: windowEnabled
            ? {
                start: formatClock(windowStart),
                end: formatClock(windowEnd),
              }
            : null,
        },
        'visitor'
      );

      const { formattedDate, timeframe } = timeCalc(result.valid_until);
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
    startDate,
    user_id,
    visitorName,
    windowEnabled,
    windowEnd,
    windowStart,
  ]);

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
        title="Set Duration of Access Code"
        titleClassName="text-[21.88px]"
        subtitle="Select the date and time duration of your guest access code."
        subtitleClassName="text-[#878686] mt-1"
        containerClassName="mt-[25px]"
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: 17,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => openPicker('startDate')}
          className="flex-row items-center justify-between rounded-[8px] bg-white px-4 py-3"
        >
          <View className="flex-row items-center gap-4 flex-1 pr-3">
            <UpcomingCalendarIcon width={16} height={16} />
            <Text
              className={`text-sm font-inter-light ${startDate ? 'text-[#0A1F29]' : 'text-[#9B9797]'}`}
            >
              {formatDateLabel(startDate, 'Enter Start Date')}
            </Text>
          </View>
          <FormChevronRightIcon width={20} height={20} />
        </Pressable>

        <View className="flex-row items-center gap-3 px-[41px] mt-2 mb-3.5">
          <View className="h-px flex-1 bg-[#D9D9D9]" />
          <Text className="text-[11.2px] font-inter-regular text-[#878686]">to</Text>
          <View className="h-px flex-1 bg-[#D9D9D9]" />
        </View>

        <Pressable
          onPress={() => openPicker('endDate')}
          className="flex-row items-center justify-between rounded-[8px] bg-white px-4 py-3"
        >
          <View className="flex-row items-center gap-4 flex-1">
            <UpcomingCalendarIcon width={16} height={16} />
            <Text
              className={`text-sm font-inter-light ${endDate ? 'text-[#0A1F29]' : 'text-[#9B9797]'}`}
            >
              {formatDateLabel(endDate, 'Enter End Date')}
            </Text>
          </View>
          <FormChevronRightIcon width={20} height={20} />
        </Pressable>

        <Text className="px-1 text-[11.2px] font-inter-regular text-[#878686] mt-[9px]">
          Duration: {formatDuration(startDate, endDate)}
        </Text>

        <View className="rounded-[16px] bg-white px-4 py-4 flex-row items-center justify-between mt-[30px]">
          <View className="flex-row items-center gap-4 flex-1 ">
            <UpcomingValidityWindowIcon width={16} height={16} />
            <Text className="text-sm font-inter-light text-[#878686]">Set Validity Window</Text>
          </View>
          <Switch
            value={windowEnabled}
            onValueChange={setWindowEnabled}
            trackColor={{ false: '#D9D9D9', true: '#1B998B' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {windowEnabled && daysInRange.length > 0 ? (
          <View className="rounded-[16px] bg-white p-4 mt-6">
            <Text className="text-[#878686] text-sm font-inter-light mb-[9px]">
              Validity Window
            </Text>
            <View className="flex-col gap-[9px]">
              {daysInRange.map((day, index) => (
                <View
                  key={day.toISOString()}
                  className={`px-3 py-2  ${index < daysInRange.length - 1 ? 'border-b-[0.3px] border-[#9B9797]' : ''}`}
                >
                  <Text className="text-[11.2px] font-inter-regular text-[#113E55]">
                    {formatDayHeading(day)}
                  </Text>
                  <View className="mt-2 flex-row items-start justify-between">
                    <Pressable onPress={() => openPicker('windowStart')}>
                      <Text className="text-[8.96px] font-inter-medium text-[#878686]">Start</Text>
                      <Text className="mt-1.5 text-[21.88px] font-ubuntu-semibold text-[#113E55]">
                        {formatClock(windowStart)}
                      </Text>
                    </Pressable>
                    <Pressable onPress={() => openPicker('windowEnd')}>
                      <Text className="text-[8.96px] font-inter-medium text-[#878686]">End</Text>
                      <Text className="mt-1.5 text-[21.88px] font-ubuntu-semibold text-[#113E55]">
                        {formatClock(windowEnd)}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <Pressable
          onPress={handleGenerate}
          disabled={!canGenerate || generating}
          className="mt-8 items-center justify-center rounded-full p-4"
          style={{ backgroundColor: canGenerate && !generating ? '#113E55' : '#C8CDD0' }}
        >
          {generating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-sm font-ubuntu-semibold text-white">Generate Code</Text>
          )}
        </Pressable>
      </ScrollView>

      {pickerTarget && Platform.OS === 'ios' ? (
        <Modal transparent animationType="slide" visible onRequestClose={closePicker}>
          <Pressable className="flex-1 justify-end bg-black/30" onPress={closePicker}>
            <Pressable className="rounded-t-[16px] bg-white px-4 pb-8 pt-3" onPress={() => {}}>
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-sm font-inter-medium text-[#0A1F29]">Select</Text>
                <Pressable onPress={closePicker}>
                  <Text className="text-sm font-inter-medium text-[#113E55]">Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={pickerValue}
                mode={pickerMode}
                display="spinner"
                onChange={onPickerChange}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}

      {pickerTarget && Platform.OS === 'android' ? (
        <DateTimePicker
          value={pickerValue}
          mode={pickerMode}
          display="default"
          onChange={onPickerChange}
        />
      ) : null}
    </SafeAreaView>
  );
}
