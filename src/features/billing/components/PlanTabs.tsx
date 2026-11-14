import { Pressable, Text, View } from 'react-native';
import { cn } from '@/src/shared/utils/cn';

export type PlanTab<K extends string = string> = { key: K; label: string };

export type PlanTabsProps<K extends string = string> = {
  tabs: PlanTab<K>[];
  value: K | null;
  onChange: (key: K) => void;
  /** Row wrapper classes. The design row has 16pt side padding (`px-4`) by default. */
  className?: string;
};

/**
 * Plain text tabs above the plan details (Watch / Sentinel / Command / Custom).
 * The active tab gets the light-teal pill and dark-teal label; tabs are spread
 * across the row like the Figma auto-layout (space-between, 16pt sides).
 */
export default function PlanTabs<K extends string = string>({
  tabs,
  value,
  onChange,
  className,
}: PlanTabsProps<K>) {
  return (
    <View
      accessibilityRole="tablist"
      className={cn('min-h-[37px] flex-row items-center justify-between px-4', className)}
    >
      {tabs.map((tab) => {
        const active = tab.key === value;
        return (
          <Pressable
            key={tab.key}
            onPress={() => {
              if (!active) onChange(tab.key);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={tab.label}
            hitSlop={{ top: 4, bottom: 4, left: 6, right: 6 }}
            className={cn(
              'rounded-[8px] p-2 active:opacity-70',
              active ? 'bg-light-teal' : 'bg-transparent'
            )}
          >
            <Text
              className={cn(
                'font-inter-regular text-caption leading-[13.6px]',
                active ? 'text-dark-teal' : 'text-grey'
              )}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
