import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import BottomSheet from '@/src/shared/components/feedback/BottomSheet';
import { BlurView } from 'expo-blur';
import MonthCalendar from '@/src/features/access-codes/components/MonthCalendar';
import SetDateCalendarIcon from '@/src/assets/icons/set-date-calendar.svg';

type DateRangePickerModalProps = {
  visible: boolean;
  onClose: () => void;
  onApply: (start: Date, end: Date) => void;
  initialStart?: Date | null;
  initialEnd?: Date | null;
};

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function firstOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function DateRow({ value, placeholder }: { value: Date | null; placeholder: string }) {
  return (
    <View className="h-[42px] flex-row items-center gap-4 rounded-lg bg-white px-4">
      <View className="h-4 w-4 items-center justify-center">
        <SetDateCalendarIcon />
      </View>
      <Text
        allowFontScaling={false}
        className="font-inter-light text-sm"
        style={{ color: value ? '#0A1F29' : '#878686' }}
      >
        {value ? formatDate(value) : placeholder}
      </Text>
    </View>
  );
}

export default function DateRangePickerModal({
  visible,
  onClose,
  onApply,
  initialStart = null,
  initialEnd = null,
}: DateRangePickerModalProps) {
  const [currentMonth, setCurrentMonth] = useState(() => firstOfMonth(initialStart ?? new Date()));
  // Held as start-of-day so day comparisons are exact; the end is widened on apply.
  const [startDate, setStartDate] = useState<Date | null>(
    initialStart ? startOfDay(initialStart) : null
  );
  const [endDate, setEndDate] = useState<Date | null>(initialEnd ? startOfDay(initialEnd) : null);

  useEffect(() => {
    if (!visible) return;
    setStartDate(initialStart ? startOfDay(initialStart) : null);
    setEndDate(initialEnd ? startOfDay(initialEnd) : null);
    setCurrentMonth(firstOfMonth(initialStart ?? new Date()));
  }, [visible, initialStart, initialEnd]);

  const handleDatePress = (selected: Date) => {
    const day = startOfDay(selected);
    if (!startDate || endDate) {
      setStartDate(day);
      setEndDate(null);
      setCurrentMonth(firstOfMonth(day));
      return;
    }
    if (day < startDate) {
      setStartDate(day);
      setCurrentMonth(firstOfMonth(day));
      return;
    }
    setEndDate(day);
  };

  const canApply = !!startDate && !!endDate;

  const handleApply = () => {
    if (!startDate || !endDate) return;
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    onApply(startDate, end);
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      scrimClassName="flex-1 justify-end"
      backdrop={<BlurView intensity={20} style={StyleSheet.absoluteFill} />}
      panelStyle={{
        height: 731,
        maxHeight: '92%',
        backgroundColor: '#F6F7F7',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        paddingHorizontal: 24,
        overflow: 'hidden',
      }}
    >
      <Text
        allowFontScaling={false}
        className="mb-[46px] mt-[66px] font-ubuntu-medium text-[27.34px] text-primary"
      >
        Set Date
      </Text>

      <View className="mb-[43px] gap-[13px]">
        <DateRow value={startDate} placeholder="Enter Start Date" />
        <DateRow value={endDate} placeholder="Enter End Date" />
      </View>

      <View className="-mx-6">
        <MonthCalendar
          card
          cursor={currentMonth}
          onCursorChange={setCurrentMonth}
          selectedDates={[startDate, endDate]}
          onSelectDate={handleDatePress}
        />
      </View>

      <Pressable
        onPress={handleApply}
        disabled={!canApply}
        className="mt-4 h-14 w-full items-center justify-center rounded-full bg-primary"
        style={{ opacity: canApply ? 1 : 0.5 }}
      >
        <Text allowFontScaling={false} className="font-ubuntu-medium text-base text-white">
          Apply
        </Text>
      </Pressable>
    </BottomSheet>
  );
}
