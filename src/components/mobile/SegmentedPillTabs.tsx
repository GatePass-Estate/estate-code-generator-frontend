import { View, Text, TouchableOpacity, type StyleProp, type ViewStyle } from 'react-native';

export type SegmentedPillTabOption<T extends string> = {
  value: T;
  label: string;
  showDot?: boolean;
};

type SegmentedPillTabsProps<T extends string> = {
  options: readonly [SegmentedPillTabOption<T>, SegmentedPillTabOption<T>];
  value: T;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
  className?: string;
};

const TRACK_WIDTH = 229;
const ACTIVE_WIDTH = 119;
const INACTIVE_WIDTH = TRACK_WIDTH - ACTIVE_WIDTH;

export default function SegmentedPillTabs<T extends string>({
  options,
  value,
  onChange,
  style,
  className,
}: SegmentedPillTabsProps<T>) {
  const [left, right] = options;
  const isLeftActive = value === left.value;

  return (
    <View className={className} style={style}>
      <View
        className="relative overflow-hidden rounded-[24px] bg-[#EFF1F1]"
        style={{ width: TRACK_WIDTH, height: 40 }}
      >
        <View
          className="absolute top-0 rounded-[24px] bg-[#CEE5ED]"
          style={{
            width: ACTIVE_WIDTH,
            height: 40,
            left: isLeftActive ? 0 : INACTIVE_WIDTH,
          }}
        />
        <View className="absolute inset-0 flex-row">
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onChange(left.value)}
            className="items-center justify-center"
            style={{ width: ACTIVE_WIDTH, height: 40 }}
          >
            <Text
              className={`text-[11.2px] font-inter-regular ${
                isLeftActive ? 'text-[#113E55]' : 'text-[#878686]'
              }`}
            >
              {left.label}
            </Text>
            {left.showDot && !isLeftActive ? (
              <View className="absolute right-[14px] top-[4px] h-[9px] w-[9px] rounded-full bg-[#E30404]" />
            ) : null}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onChange(right.value)}
            className="relative items-center justify-center"
            style={{ width: INACTIVE_WIDTH, height: 40 }}
          >
            <Text
              className={`text-[11.2px] font-inter-regular ${
                !isLeftActive ? 'text-[#113E55]' : 'text-[#878686]'
              }`}
            >
              {right.label}
            </Text>
            {right.showDot && isLeftActive ? (
              <View className="absolute right-[14px] top-[4px] h-[9px] w-[9px] rounded-full bg-[#E30404]" />
            ) : null}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
