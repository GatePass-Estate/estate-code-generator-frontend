import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { DateTimeFieldIcon } from '@/src/assets/svgs';
import MonthCalendar, { startOfDay } from '@/src/components/mobile/MonthCalendar';

type IncidentDatePickerModalProps = {
  visible: boolean;
  onClose: () => void;
  onApply: (start: Date, end: Date) => void;
  initialStart?: Date | null;
  initialEnd?: Date | null;
};

function formatDisplay(date: Date | null) {
  if (!date) return null;
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Figma 6578:4758 (start) / 6578:4757 (end) */
function DateField({
  placeholder,
  value,
  onPress,
}: {
  placeholder: string;
  value: string | null;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="w-full max-w-[328px] flex-row items-center justify-between rounded-lg bg-white px-4 py-3"
    >
      <View className="flex-row items-center gap-4">
        <DateTimeFieldIcon width={16} height={16} color="#878686" />
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          className={`text-sm font-inter-light leading-[normal] ${
            value ? 'text-[#0A1F29]' : 'text-[#878686]'
          }`}
        >
          {value ?? placeholder}
        </Text>
      </View>
    </Pressable>
  );
}

/**
 * Figma 6578:4753 — Set Date sheet.
 * Shell matches CodeActionsSheet; calendar matches validity CodeDateTimePicker / MonthCalendar.
 */
export default function IncidentDatePickerModal({
  visible,
  onClose,
  onApply,
  initialStart = null,
  initialEnd = null,
}: IncidentDatePickerModalProps) {
  const [cursor, setCursor] = useState(
    () =>
      new Date(
        (initialStart ?? new Date()).getFullYear(),
        (initialStart ?? new Date()).getMonth(),
        1
      )
  );
  const [startDate, setStartDate] = useState<Date | null>(initialStart);
  const [endDate, setEndDate] = useState<Date | null>(initialEnd);
  const [activeField, setActiveField] = useState<'start' | 'end'>('start');

  useEffect(() => {
    if (!visible) return;
    const seed = initialStart ?? new Date();
    setStartDate(initialStart);
    setEndDate(initialEnd);
    setCursor(new Date(seed.getFullYear(), seed.getMonth(), 1));
    setActiveField('start');
  }, [visible, initialStart, initialEnd]);

  const handleSelectDate = (date: Date) => {
    const selected = startOfDay(date);

    if (activeField === 'start') {
      setStartDate(selected);
      if (endDate && selected.getTime() > startOfDay(endDate).getTime()) {
        setEndDate(null);
      }
      setActiveField('end');
      setCursor(new Date(selected.getFullYear(), selected.getMonth(), 1));
      return;
    }

    if (!startDate || selected.getTime() < startOfDay(startDate).getTime()) {
      setStartDate(selected);
      setEndDate(null);
      setActiveField('end');
      setCursor(new Date(selected.getFullYear(), selected.getMonth(), 1));
      return;
    }

    // Same-day range is valid for a single-day custom window.
    const end = new Date(selected);
    end.setHours(23, 59, 59, 999);
    setEndDate(end);
    onApply(startDate, end);
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/80" onPress={onClose}>
        <Pressable
          className="rounded-t-[40px] bg-[#F6F7F7]"
          onPress={() => {}}
          style={{ height: 731 }}
        >
          <View className="h-[34px] items-center justify-center">
            <View className="h-[7px] w-[134px] rounded-[4px] bg-[#9B9797]" />
          </View>

          <View className="flex-1 pt-[66px]">
            <Text
              allowFontScaling={false}
              className="px-[23.5px] text-[27.34px] font-ubuntu-medium text-[#113E55]"
            >
              Set Date
            </Text>

            <View className="mt-[47px] items-center gap-[11px] px-[23.5px]">
              <DateField
                placeholder="Enter Start Date"
                value={formatDisplay(startDate)}
                onPress={() => {
                  setActiveField('start');
                  if (startDate) {
                    setCursor(new Date(startDate.getFullYear(), startDate.getMonth(), 1));
                  }
                }}
              />
              <DateField
                placeholder="Enter End Date"
                value={formatDisplay(endDate)}
                onPress={() => {
                  setActiveField('end');
                  if (endDate) {
                    setCursor(new Date(endDate.getFullYear(), endDate.getMonth(), 1));
                  } else if (startDate) {
                    setCursor(new Date(startDate.getFullYear(), startDate.getMonth(), 1));
                  }
                }}
              />
            </View>

            <View className="mt-[31px] items-center">
              <MonthCalendar
                card
                cursor={cursor}
                onCursorChange={setCursor}
                selectedDates={[startDate, endDate]}
                onSelectDate={handleSelectDate}
                minDate={activeField === 'end' ? startDate : null}
              />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
