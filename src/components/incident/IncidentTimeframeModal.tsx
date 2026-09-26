import { Modal, Pressable, Text, View } from 'react-native';
import { CheckRingIcon } from '@/src/assets/svgs';

type IncidentTimeframeModalProps = {
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
      className="h-12 w-full flex-row items-center justify-between overflow-visible rounded-2xl bg-[#EFF1F1] px-4"
      hitSlop={4}
    >
      <Text
        allowFontScaling={false}
        numberOfLines={1}
        className="shrink text-sm font-inter-light leading-[normal] text-[#113E55]"
      >
        {label}
      </Text>
      <View className="ml-2 h-6 w-6 shrink-0 items-center justify-center">
        {selected ? <CheckRingIcon width={24} height={24} /> : null}
      </View>
    </Pressable>
  );
}

export default function IncidentTimeframeModal({
  visible,
  onClose,
  selectedLabel,
  onSelect,
  onCustomSelect,
}: IncidentTimeframeModalProps) {
  const handleSelect = (opt: (typeof OPTIONS)[number]) => {
    if (opt === 'Custom') {
      onCustomSelect();
      return;
    }
    const { start, end } = rangeForOption(opt);
    onSelect(opt, start, end);
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/80" onPress={onClose}>
        <Pressable
          className="rounded-t-[40px] bg-[#F6F7F7]"
          onPress={() => {}}
          style={{ height: 588 }}
        >
          <View className="h-[34px] items-center justify-center">
            <View className="h-[7px] w-[134px] rounded-[4px] bg-[#9B9797]" />
          </View>

          <View className="px-5 pt-[66px]">
            <Text
              allowFontScaling={false}
              className="text-[27.34px] font-ubuntu-medium text-[#113E55]"
            >
              Set Timeframe
            </Text>

            <View className="mt-6 gap-2 p-2">
              {OPTIONS.map((opt) => (
                <TimeframeOption
                  key={opt}
                  label={opt}
                  selected={selectedLabel === opt}
                  onPress={() => handleSelect(opt)}
                />
              ))}
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
