import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarChevronLeftIcon, CalendarChevronRightIcon } from '@/src/assets/svgs';
import Button, { BUTTON_MARGIN_BOTTOM } from './Button';
import TimeWheelColumn from './TimeWheelColumn';
import { UbuntuSans } from '@/src/constants/fonts';
import { sharedStyles } from '@/src/theme/styles';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const PRESETS = [
  { label: '30mins', minutes: 30 },
  { label: '1hr', minutes: 60 },
  { label: '3hrs', minutes: 180 },
  { label: '5hrs', minutes: 300 },
  { label: '8hrs', minutes: 480 },
  { label: '12hrs', minutes: 720 },
] as const;
/** Figma 2245:4774 — dates inset 11.33% of 375 */
const DATE_INSET = 0.1133;
const DAY_ROW_H = 36;
const WEEKDAY_H = 32;
const MONTH_ROW_H = 18;
const SELECTED_W = 21;
const SELECTED_H = 20;
const CHEVRON_W = 7;
const CHEVRON_H = 13;

const startOfDay = (date: Date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

type Cell = { date: Date; inMonth: boolean };

function monthCells(year: number, month: number): Cell[] {
  const first = new Date(year, month, 1);
  const startOffset = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const cells: Cell[] = [];

  for (let i = startOffset - 1; i >= 0; i -= 1) {
    cells.push({ date: new Date(year, month - 1, prevMonthDays - i), inMonth: false });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ date: new Date(year, month, day), inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date;
    cells.push({
      date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1),
      inMonth: false,
    });
  }
  return cells;
}

type CodeDateTimePickerProps = {
  mode: 'start' | 'end';
  value: Date;
  minDate?: Date | null;
  onBack: () => void;
  onSet: (next: Date) => void;
};

export default function CodeDateTimePicker({
  mode,
  value,
  minDate,
  onBack,
  onSet,
}: CodeDateTimePickerProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [draft, setDraft] = useState(() => new Date(value));
  const [cursor, setCursor] = useState(() => new Date(value.getFullYear(), value.getMonth(), 1));

  const cells = useMemo(() => monthCells(cursor.getFullYear(), cursor.getMonth()), [cursor]);
  const monthLabel = cursor.toLocaleString('en-GB', { month: 'long' });
  const minDay = minDate ? startOfDay(minDate).getTime() : null;
  const gridPad = screenWidth * DATE_INSET;
  const weekCount = cells.length / 7;

  const applyDate = (date: Date) => {
    const next = new Date(draft);
    next.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    setDraft(next);
  };

  const applyPreset = (minutes: number) => {
    const base = mode === 'end' && minDate ? new Date(minDate) : new Date();
    const next = new Date(base.getTime() + minutes * 60_000);
    setDraft(next);
    setCursor(new Date(next.getFullYear(), next.getMonth(), 1));
  };

  return (
    <SafeAreaView
      style={[sharedStyles.container, sharedStyles.modalContainer, { backgroundColor: '#F6F7F7' }]}
      edges={['top']}
    >
      <Pressable
        onPress={onBack}
        className="h-[30px] w-[30px] items-center justify-center rounded-full bg-[#EFF1F1]"
      >
        <MaterialIcons name="keyboard-arrow-left" size={24} color="#113E55" />
      </Pressable>

      <Text className="mt-[25px] text-[27.34px] font-ubuntu-medium text-[#113E55]">
        {mode === 'start' ? 'Set Start Date' : 'Set End Date'}
      </Text>
      <Text className="mt-2 text-sm font-inter-light text-[#878686]">
        {mode === 'start'
          ? 'Select the date and time your guest code starts'
          : 'Select the date and time your guest code ends'}
      </Text>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: BUTTON_MARGIN_BOTTOM + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            marginHorizontal: -20,
            width: screenWidth,
            paddingHorizontal: gridPad,
            paddingTop: 45.5,
            paddingBottom: 8,
          }}
        >
          <View
            style={{
              height: MONTH_ROW_H,
              marginBottom: 37,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Pressable
              onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              hitSlop={16}
              style={{
                flex: 1,
                height: MONTH_ROW_H,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CalendarChevronLeftIcon width={CHEVRON_W} height={CHEVRON_H} />
            </Pressable>
            <Text
              className="text-center text-[12px] font-roboto text-[#0A1F29]"
              style={{ flex: 5, fontWeight: '700' }}
            >
              {monthLabel}
            </Text>
            <Pressable
              onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              hitSlop={16}
              style={{
                flex: 1,
                height: MONTH_ROW_H,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CalendarChevronRightIcon width={CHEVRON_W} height={CHEVRON_H} />
            </Pressable>
          </View>

          <View className="flex-row" style={{ height: WEEKDAY_H, alignItems: 'center' }}>
            {WEEKDAYS.map((day, index) => (
              <View
                key={`${day}-${index}`}
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text className="text-[13px] font-inter-semibold text-[#113E55]">{day}</Text>
              </View>
            ))}
          </View>
          {Array.from({ length: weekCount }, (_, week) => (
            <View
              key={week}
              className="flex-row"
              style={{ height: DAY_ROW_H, alignItems: 'center' }}
            >
              {cells.slice(week * 7, week * 7 + 7).map((cell) => {
                const selected = cell.inMonth && isSameDay(cell.date, draft);
                const disabled = minDay != null && startOfDay(cell.date).getTime() < minDay;
                const muted = !cell.inMonth || disabled;
                return (
                  <Pressable
                    key={cell.date.toISOString()}
                    onPress={() => {
                      if (disabled || !cell.inMonth) return;
                      applyDate(cell.date);
                    }}
                    style={{
                      flex: 1,
                      height: DAY_ROW_H,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <View
                      style={{
                        width: SELECTED_W,
                        height: SELECTED_H,
                        borderRadius: 20,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: selected ? '#CEE5ED' : 'transparent',
                      }}
                    >
                      <Text
                        className="text-[13px] font-inter-light"
                        style={{
                          color: muted ? '#BDBDBD' : selected ? '#113E55' : '#0A1F29',
                        }}
                      >
                        {cell.date.getDate()}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        <View className="flex-row items-center px-[41px] mt-3">
          <View className="h-px flex-1 bg-[#D9D9D9]" />
          <Text className="p-2.5 text-base font-ubuntu-light text-[#9B9797]">
            {mode === 'start' ? 'Set Start Time' : 'Set End Time'}
          </Text>
          <View className="h-px flex-1 bg-[#D9D9D9]" />
        </View>

        <View className="mt-3  items-center rounded-2xl bg-white px-4 py-8">
          <Text className="mb-2 text-[11.2px] font-inter-regular text-[#878686]">
            {mode === 'start' ? 'START TIME' : 'END TIME'}
          </Text>
          <View className="flex-row items-center">
            <TimeWheelColumn
              value={draft.getHours()}
              length={24}
              onChange={(hours) => {
                const next = new Date(draft);
                next.setHours(hours);
                setDraft(next);
              }}
            />
            <Text className="w-2 text-center text-base font-inter-medium text-[#113E55]">:</Text>
            <TimeWheelColumn
              value={draft.getMinutes()}
              length={60}
              onChange={(minutes) => {
                const next = new Date(draft);
                next.setMinutes(minutes);
                setDraft(next);
              }}
            />
          </View>

          <View className="mt-8 w-full">
            <Text
              className="mb-2 ml-[9px] text-[#878686]"
              style={{
                fontFamily: UbuntuSans.regular,
                fontSize: 12,
                lineHeight: 14,
              }}
            >
              Preset
            </Text>
            <View className="flex-row items-center gap-[7px]">
              {PRESETS.map((preset) => (
                <Pressable
                  key={preset.label}
                  onPress={() => applyPreset(preset.minutes)}
                  className="h-[34px] shrink-0 items-center justify-center rounded-2xl bg-[#EFF1F1] px-3"
                >
                  <Text
                    className="text-center text-[#878686]"
                    style={{
                      fontFamily: UbuntuSans.regular,
                      fontSize: 9,
                      lineHeight: 10,
                      includeFontPadding: false,
                    }}
                  >
                    {preset.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <Button label="Set" className="mt-8 self-center" onPress={() => onSet(draft)} />
      </ScrollView>
    </SafeAreaView>
  );
}
