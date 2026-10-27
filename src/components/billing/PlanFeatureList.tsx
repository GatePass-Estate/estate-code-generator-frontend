import { Pressable, Text, View } from 'react-native';
import { cn } from '@/src/lib/cn';
import {
  CheckCircleFilledIcon,
  CheckCircleOutlineIcon,
  LockOutlineIcon,
} from '@/src/components/billing/BillingIcons';

export type PlanFeatureRowState = 'included' | 'locked' | 'selectable';

export type PlanFeatureRow = {
  key: string;
  label: string;
  state: PlanFeatureRowState;
};

export type PlanFeatureListProps = {
  rows: PlanFeatureRow[];
  /** Keys of `selectable` rows that are currently ticked (Custom plan builder). */
  selectedKeys?: string[];
  onToggle?: (key: string) => void;
  /**
   * Grey out the labels of included rows (the Change Plan design shows the
   * target plan's features in #878686; Choose Plan uses #0A1F29).
   */
  mutedIncluded?: boolean;
  /** Card classes; defaults to the Choose Plan spacing (30pt sides, 40pt top/bottom). */
  className?: string;
};

const LABEL = 'flex-1 font-inter-regular text-[11.2px] leading-[13.6px]';

/**
 * White feature card listing what a plan includes (navy filled tick) and what it
 * locks (grey padlock). In Custom mode rows are `selectable`: an outline tick that
 * fills navy when chosen.
 */
export default function PlanFeatureList({
  rows,
  selectedKeys = [],
  onToggle,
  mutedIncluded = false,
  className,
}: PlanFeatureListProps) {
  return (
    <View className={cn('rounded-[16px] bg-white px-[30px] py-10', className)}>
      <View className="gap-2">
        {rows.map((row) => {
          if (row.state === 'locked') {
            return (
              <View
                key={row.key}
                className="flex-row items-center gap-2"
                accessible
                accessibilityLabel={`${row.label}, not included`}
              >
                <LockOutlineIcon />
                <Text className={cn(LABEL, 'text-[#878686]')}>{row.label}</Text>
              </View>
            );
          }

          if (row.state === 'selectable') {
            const checked = selectedKeys.includes(row.key);
            return (
              <Pressable
                key={row.key}
                onPress={onToggle ? () => onToggle(row.key) : undefined}
                disabled={!onToggle}
                accessibilityRole="checkbox"
                accessibilityState={{ checked, disabled: !onToggle }}
                accessibilityLabel={row.label}
                hitSlop={{ top: 4, bottom: 4 }}
                className="flex-row items-center gap-2 active:opacity-70"
              >
                {checked ? <CheckCircleFilledIcon /> : <CheckCircleOutlineIcon />}
                <Text className={cn(LABEL, checked ? 'text-[#113E55]' : 'text-[#9B9797]')}>
                  {row.label}
                </Text>
              </Pressable>
            );
          }

          return (
            <View
              key={row.key}
              className="flex-row items-center gap-2"
              accessible
              accessibilityLabel={`${row.label}, included`}
            >
              <CheckCircleFilledIcon />
              <Text className={cn(LABEL, mutedIncluded ? 'text-[#878686]' : 'text-[#0A1F29]')}>
                {row.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
