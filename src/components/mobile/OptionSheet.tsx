import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

export type OptionSheetItem = {
  label: string;
  value: string;
  /** Selecting this ticks every other option and locks them (e.g. "All Users"). */
  selectsAll?: boolean;
};

type OptionSheetProps = {
  visible: boolean;
  title?: string;
  items: OptionSheetItem[];
  /** Currently selected values. Single-select sheets pass at most one. */
  selected: string[];
  multiple?: boolean;
  onChange: (next: string[]) => void;
  onClose: () => void;
};

/** Check ring from the design: tinted disc with a tick, hollow when unselected. */
function CheckRing({ checked }: { checked: boolean }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle
        cx={12}
        cy={12}
        r={8}
        fill={checked ? '#CEE5ED' : 'transparent'}
        stroke={checked ? '#CEE5ED' : '#C9CECF'}
        strokeWidth={1.5}
      />
      {checked && (
        <Path
          d="M8.6 12.2l2.2 2.2 4.6-4.6"
          stroke="#113E55"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </Svg>
  );
}

/**
 * Bottom sheet list of options, single or multi select.
 *
 * Multi-select supports an "everything" entry (`selectsAll`): choosing it ticks
 * every other option and locks them, so the admin can never be looking at a
 * selection that contradicts itself. Unticking it hands control back.
 */
export default function OptionSheet({
  visible,
  title,
  items,
  selected,
  multiple = false,
  onChange,
  onClose,
}: OptionSheetProps) {
  const insets = useSafeAreaInsets();

  const allOption = items.find((item) => item.selectsAll);
  const allActive = !!allOption && selected.includes(allOption.value);

  const handlePress = (item: OptionSheetItem) => {
    if (!multiple) {
      onChange([item.value]);
      onClose();
      return;
    }

    if (item.selectsAll) {
      // Ticking "all" selects everything; unticking clears the lot.
      onChange(allActive ? [] : items.map((entry) => entry.value));
      return;
    }

    // Individual rows are inert while "all" is holding them selected.
    if (allActive) return;

    const next = selected.includes(item.value)
      ? selected.filter((value) => value !== item.value)
      : [...selected, item.value];
    onChange(next);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40 justify-end" onPress={onClose}>
        {/* Swallow taps inside the sheet so only the scrim closes it. */}
        <Pressable
          className="bg-[#F6F7F7] rounded-t-[40px] px-5 pt-3"
          style={{ paddingBottom: insets.bottom + 24 }}
          onPress={() => {}}
        >
          <View className="h-1 w-[68px] rounded-full bg-[#9B9797] self-center mb-6" />

          {!!title && (
            <Text className="text-primary font-ubuntu-semibold text-base mb-4">{title}</Text>
          )}

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
            <View className="gap-3 pb-2">
              {items.map((item) => {
                const checked = selected.includes(item.value);
                const locked = multiple && allActive && !item.selectsAll;

                return (
                  <Pressable
                    key={item.value}
                    onPress={() => handlePress(item)}
                    accessibilityRole={multiple ? 'checkbox' : 'radio'}
                    accessibilityState={{ checked, disabled: locked }}
                    className="flex-row items-center justify-between bg-[#EFF1F1] rounded-[16px] h-12 px-5"
                    style={{ opacity: locked ? 0.7 : 1 }}
                  >
                    <Text className="text-primary font-inter-light text-sm">{item.label}</Text>
                    <CheckRing checked={checked} />
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
