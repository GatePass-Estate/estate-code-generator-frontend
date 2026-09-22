import { Modal, Pressable, Text, View } from 'react-native';
import { CheckRingIcon } from '@/src/assets/svgs';

type IncidentTimeframeModalProps = {
  visible: boolean;
  onClose: () => void;
  selectedLabel: string;
  onSelect: (label: string, start: Date, end: Date) => void;
  onCustomSelect: () => void;
};

/** Figma 6578:4687 */
const OPTIONS = ['Last Week', 'Last Month', 'Last Quarter', 'Custom'] as const;

function rangeForOption(opt: string): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  if (opt === 'Last Week') start.setDate(end.getDate() - 7);
  else if (opt === 'Last Month') start.setMonth(end.getMonth() - 1);
  else if (opt === 'Last Quarter') start.setMonth(end.getMonth() - 3);
  return { start, end };
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

/**
 * Figma 6578:4687 — Set Timeframe sheet.
 * Shell matches CodeActionsSheet (freeze / extend / share).
 */
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
