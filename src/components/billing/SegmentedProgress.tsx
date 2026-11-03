import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { cn } from '@/src/lib/cn';

const FILLED = '#F46036';
const TRACK = '#EFF1F1';

function clamp01(n: number) {
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0;
}

function percentLabel(progress: number) {
  return `${Math.round(clamp01(progress) * 100)} percent`;
}

function EdgeLabel({ children, align }: { children: ReactNode; align: 'left' | 'right' }) {
  if (children == null || children === false) return <View />;
  if (typeof children !== 'string') return <>{children}</>;
  return (
    <Text
      className={cn(
        'font-inter-regular text-[11.2px] leading-[13.6px] text-[#0A1F29]',
        align === 'right' && 'text-right'
      )}
    >
      {children}
    </Text>
  );
}

export type SegmentedProgressProps = {
  /** 0..1 — rounded to the nearest whole segment. */
  progress: number;
  /** Number of blocks; the design uses 30. */
  segments?: number;
  /** Optional captions under the bar (string → Inter 11.2 #0A1F29, or any node). */
  startLabel?: ReactNode;
  endLabel?: ReactNode;
  className?: string;
};

/**
 * Block progress bar used for the billing cycle and AI tool validity:
 * 8x10 blocks, 2pt apart, orange for elapsed and light grey for remaining,
 * with the outer ends fully rounded. Blocks flex to fill the available width.
 */
export function SegmentedProgress({
  progress,
  segments = 30,
  startLabel,
  endLabel,
  className,
}: SegmentedProgressProps) {
  const count = Math.max(1, Math.round(segments));
  const filled = Math.round(clamp01(progress) * count);
  const hasLabels = startLabel != null || endLabel != null;

  return (
    <View className={cn('w-full', className)}>
      <View
        className="h-[10px] flex-row gap-[2px]"
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(clamp01(progress) * 100) }}
        accessibilityLabel={percentLabel(progress)}
      >
        {Array.from({ length: count }, (_, i) => (
          <View
            key={i}
            className={cn(
              'h-[10px] flex-1',
              i === 0 && 'rounded-l-full',
              i === count - 1 && 'rounded-r-full'
            )}
            style={{ backgroundColor: i < filled ? FILLED : TRACK }}
          />
        ))}
      </View>
      {hasLabels ? (
        <View className="mt-[7px] flex-row items-start justify-between gap-3">
          <EdgeLabel align="left">{startLabel}</EdgeLabel>
          <EdgeLabel align="right">{endLabel}</EdgeLabel>
        </View>
      ) : null}
    </View>
  );
}

export type ProgressBarProps = {
  /** 0..1 */
  progress: number;
  className?: string;
};

/**
 * Solid rounded bar used for "Seat Usage": orange fill on a #EFF1F1 track,
 * 10pt tall. The fill keeps a square leading edge like the design.
 */
export function ProgressBar({ progress, className }: ProgressBarProps) {
  const value = clamp01(progress);
  return (
    <View
      className={cn('h-[10px] w-full overflow-hidden rounded-full', className)}
      style={{ backgroundColor: TRACK }}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
      accessibilityLabel={percentLabel(value)}
    >
      <View className="h-full" style={{ width: `${value * 100}%`, backgroundColor: FILLED }} />
    </View>
  );
}

export default SegmentedProgress;
