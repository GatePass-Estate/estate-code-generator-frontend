import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import Button from '@/src/components/mobile/Button';
import { cn } from '@/src/lib/cn';

export type BillingSectionCardProps = {
  /** Small caption at the top, e.g. 'Seat Usage'. */
  eyebrow: string;
  /** Main line, e.g. 'Active Users'. Strings get the design style; nodes render as-is. */
  title?: ReactNode;
  /** Right-aligned caption on the title line, e.g. '19/50 Seats'. */
  trailing?: string | null;
  /** Rendered under the title line (progress bars etc.), 8pt below it. */
  children?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  actionLoading?: boolean;
  className?: string;
};

/**
 * White r20 section card from "Your Current Plan": eyebrow, title row with a
 * trailing count, optional body, and a full-width light-blue pill action.
 */
export default function BillingSectionCard({
  eyebrow,
  title,
  trailing,
  children,
  actionLabel,
  onAction,
  actionDisabled = false,
  actionLoading = false,
  className,
}: BillingSectionCardProps) {
  const hasTitleRow = title != null || !!trailing;

  return (
    <View className={cn('w-full gap-4 rounded-[20px] bg-white p-4', className)}>
      <View className="gap-2">
        <Text className="font-inter-regular text-[11.2px] leading-[13.6px] text-[#0A1F29]">
          {eyebrow}
        </Text>

        {hasTitleRow ? (
          // Figma keeps the trailing caption ~18pt in from the card's inner edge.
          <View className="flex-row items-end justify-between gap-2 pr-[18px]">
            {typeof title === 'string' ? (
              <Text
                className="flex-shrink font-inter-regular text-[17.5px] leading-[21.2px] text-[#113E55]"
                numberOfLines={1}
              >
                {title}
              </Text>
            ) : (
              <View className="flex-shrink">{title}</View>
            )}
            {trailing ? (
              <Text className="text-right font-inter-regular text-[11.2px] leading-[13.6px] text-[#0A1F29]">
                {trailing}
              </Text>
            ) : null}
          </View>
        ) : null}

        {children}
      </View>

      {actionLabel ? (
        <View className="px-3">
          <Button
            label={actionLabel}
            variant="secondary"
            onPress={onAction}
            disabled={actionDisabled || !onAction}
            loading={actionLoading}
            accessibilityState={{ disabled: actionDisabled || !onAction, busy: actionLoading }}
            className={cn(
              'h-[44px] w-full max-w-none py-0',
              (actionDisabled || !onAction) && !actionLoading && 'opacity-50'
            )}
          />
        </View>
      ) : null}
    </View>
  );
}
