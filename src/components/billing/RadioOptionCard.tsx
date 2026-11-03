import { Pressable, Text, View } from 'react-native';
import { cn } from '@/src/lib/cn';

export type RadioOptionCardProps = {
  selected: boolean;
  onPress: () => void;
  title: string;
  description: string;
  /** Large navy figure, e.g. '₦5,060' or 'Calculated at checkout'. */
  amount?: string | null;
  /** Small caption under the amount, e.g. 'Prorated Charge (10 Feb - 26 Feb)'. */
  footnote?: string | null;
  disabled?: boolean;
  className?: string;
};

/**
 * Change Plan timing option: a 16pt radio on the left (navy ring, 9pt navy dot
 * when selected) beside a white card with title, description, amount and footnote.
 */
export default function RadioOptionCard({
  selected,
  onPress,
  title,
  description,
  amount,
  footnote,
  disabled = false,
  className,
}: RadioOptionCardProps) {
  return (
    <View className={cn('w-full', className)}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="radio"
        accessibilityState={{ checked: selected, disabled }}
        accessibilityLabel={[title, description, amount, footnote].filter(Boolean).join(', ')}
        // Plain style fn (no className) so NativeWind does not override the press transform.
        style={({ pressed }) => ({
          opacity: disabled ? 0.5 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        })}
      >
        <View className="flex-row items-start gap-[5px]">
          {/* Radio sits level with the title line (card padding 16 + half the 17pt line). */}
          <View className="pt-[17px]">
            <View className="h-4 w-4 items-center justify-center rounded-full border border-[#113E55]">
              {selected ? <View className="h-[9px] w-[9px] rounded-full bg-[#113E55]" /> : null}
            </View>
          </View>

          <View className="flex-1 gap-2 rounded-[16px] bg-white px-4 py-4">
            <Text className="font-inter-medium text-[14px] leading-[16.9px] text-[#878686]">
              {title}
            </Text>
            <Text className="font-inter-regular text-[11.2px] leading-[13.6px] text-[#878686]">
              {description}
            </Text>
            {amount ? (
              <Text className="font-ubuntu-semibold text-[22px] leading-[26.3px] text-[#113E55]">
                {amount}
              </Text>
            ) : null}
            {footnote ? (
              <Text className="font-inter-medium text-[9px] leading-[10.8px] text-[#878686]">
                {footnote}
              </Text>
            ) : null}
          </View>
        </View>
      </Pressable>
    </View>
  );
}
