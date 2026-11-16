import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import BottomSheet from '@/src/shared/components/feedback/BottomSheet';
import { BlurView } from 'expo-blur';
import TimeframeCheckIcon from '@/src/assets/icons/timeframe-check.svg';
import TimeframeCheckSelectedIcon from '@/src/assets/icons/timeframe-check-selected.svg';

type TimeframeRangeModalProps = {
  visible: boolean;
  onClose: () => void;
  selectedLabel: string;
  onSelect: (label: string, start: Date, end: Date) => void;
  onCustomSelect: () => void;
};

const OPTIONS = ['Last Week', 'Last Month', 'Last Quarter', 'Custom'] as const;

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function rangeForOption(opt: string): { start: Date; end: Date } {
  const end = endOfDay(new Date());
  const start = startOfDay(new Date());
  if (opt === 'Last Week') start.setDate(start.getDate() - 7);
  else if (opt === 'Last Month') start.setMonth(start.getMonth() - 1);
  else if (opt === 'Last Quarter') start.setMonth(start.getMonth() - 3);
  return { start: startOfDay(start), end };
}

function TimeframeCheck({ selected }: { selected: boolean }) {
  const Icon = selected ? TimeframeCheckSelectedIcon : TimeframeCheckIcon;
  return (
    <View className="h-6 w-6 items-center justify-center">
      <Icon />
    </View>
  );
}

function TimeframeOption({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={{
        height: 48,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: selected ? '#CEE5ED' : '#EFF1F1',
        borderWidth: selected ? 0.4 : 0,
        borderColor: '#167A6F',
        paddingHorizontal: 16,
        borderRadius: 16,
      }}
    >
      <Text
        allowFontScaling={false}
        numberOfLines={1}
        style={{
          flexShrink: 1,
          fontFamily: 'Inter_18pt-Light',
          fontSize: 14,
          color: '#113E55',
        }}
      >
        {label}
      </Text>
      <TimeframeCheck selected={selected} />
    </Pressable>
  );
}

export default function IncidentTimeframeModal({
  visible,
  onClose,
  selectedLabel,
  onSelect,
  onCustomSelect,
}: TimeframeRangeModalProps) {
  const openDateAfterClose = useRef(false);

  const handleSelect = (opt: (typeof OPTIONS)[number]) => {
    if (opt === 'Custom') {
      openDateAfterClose.current = true;
      onClose();
      return;
    }
    const { start, end } = rangeForOption(opt);
    onSelect(opt, start, end);
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      onDismissed={() => {
        if (!openDateAfterClose.current) return;
        openDateAfterClose.current = false;
        onCustomSelect();
      }}
      scrimClassName="flex-1 justify-end"
      backdrop={<BlurView intensity={20} style={StyleSheet.absoluteFill} />}
      panelStyle={{
        height: 588,
        maxHeight: '92%',
        backgroundColor: '#F6F7F7',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        paddingHorizontal: 22,
        overflow: 'hidden',
      }}
    >
      <Text
        allowFontScaling={false}
        className="mb-[25px] mt-[66px] font-ubuntu-medium text-[27.34px] text-primary"
      >
        Set Timeframe
      </Text>

      <View style={{ gap: 8 }}>
        {OPTIONS.map((opt) => (
          <TimeframeOption
            key={opt}
            label={opt}
            selected={selectedLabel === opt}
            onPress={() => handleSelect(opt)}
          />
        ))}
      </View>
    </BottomSheet>
  );
}
