import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { WarningLineIcon } from '@/src/assets/svgs';
import { cn } from '@/src/lib/cn';

export type InfoNoteProps = {
  /** Note copy. Pass `text` or string children; non-string children render as-is. */
  text?: string;
  children?: ReactNode;
  className?: string;
};

/**
 * Light-blue callout with the "!" ring icon (si:warning-line), used on Manage
 * Seats and the billing sheets: #E5F6FF, r16, 10pt padding/gap, navy 11.2pt copy.
 */
export default function InfoNote({ text, children, className }: InfoNoteProps) {
  const content = children ?? text;
  return (
    <View
      className={cn(
        'w-full flex-row items-center gap-[10px] rounded-[16px] bg-[#E5F6FF] p-[10px]',
        className
      )}
      accessibilityRole="text"
    >
      <WarningLineIcon width={20} height={20} color="#113E55" />
      {typeof content === 'string' ? (
        <Text className="flex-1 font-inter-regular text-[11.2px] leading-[13.6px] text-[#113E55]">
          {content}
        </Text>
      ) : (
        <View className="flex-1">{content}</View>
      )}
    </View>
  );
}
