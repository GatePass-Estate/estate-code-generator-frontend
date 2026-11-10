import { Pressable, Text, type PressableProps } from 'react-native';
import { cn } from '@/src/lib/cn';
import ExportSvg from '@/src/assets/icons/incident-export.svg';

/** Compact primary CTA: navy 24px pill, export icon + Ubuntu label (Figma RC2). */
export default function ExportButton({ onPress, className, ...props }: PressableProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Export"
      onPress={onPress}
      hitSlop={8}
      className={cn(
        'h-[44px] flex-row items-center justify-center gap-1 overflow-hidden rounded-full border border-[#113E55] bg-[#113E55] px-4',
        className
      )}
      {...props}
    >
      <ExportSvg width={23} height={23} />
      <Text
        allowFontScaling={false}
        className="text-center text-sm font-ubuntu-semibold tracking-[-0.24px] text-[#F6F7F7]"
        style={{ fontSize: 14, lineHeight: 17, letterSpacing: -0.24 }}
      >
        Export
      </Text>
    </Pressable>
  );
}
