import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { cn } from '@/src/lib/cn';

export type SeatStepperProps = {
  value: number;
  /** Always called with a clamped integer (on −/+ press, and on blur/submit after typing). */
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  caption?: string;
  /** Screen-reader name for the number field, e.g. 'Seats'. */
  accessibilityLabel?: string;
  className?: string;
};

const ICON_COLOR = '#9B9797';
// duo-icons add-circle: #EFF1F1 disc at 30% opacity.
const BUTTON_BG = 'rgba(239, 241, 241, 0.3)';
// Ubuntu Sans 500 @ 27.34pt: Figma sizes "1200" at 62pt, i.e. ~15.5pt per digit.
const DIGIT_WIDTH = 16;

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function StepButton({
  kind,
  disabled,
  onPress,
}: {
  kind: 'decrease' | 'increase';
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={kind === 'decrease' ? 'Decrease seats' : 'Increase seats'}
      accessibilityState={{ disabled }}
      className="h-6 w-6 items-center justify-center rounded-full active:opacity-60"
      style={{ backgroundColor: BUTTON_BG, opacity: disabled ? 0.4 : 1 }}
    >
      <View className="h-[2px] w-[10px] rounded-[2px]" style={{ backgroundColor: ICON_COLOR }} />
      {kind === 'increase' ? (
        <View
          className="absolute h-[10px] w-[2px] rounded-[2px]"
          style={{ backgroundColor: ICON_COLOR }}
        />
      ) : null}
    </Pressable>
  );
}

/**
 * −  1200|  +  seat picker from the Choose Plan / Manage Seats designs.
 * The number is a real number-pad TextInput so the user can tap and type a
 * quantity; the typed text is kept locally and committed (clamped) on blur.
 */
export default function SeatStepper({
  value,
  onChange,
  min = 1,
  max = Number.MAX_SAFE_INTEGER,
  disabled = false,
  caption = 'Enter Amount',
  accessibilityLabel = 'Seats',
  className,
}: SeatStepperProps) {
  const [draft, setDraft] = useState(String(value));
  const [focused, setFocused] = useState(false);

  // Follow external changes while the user is not typing.
  useEffect(() => {
    if (!focused) setDraft(String(value));
  }, [value, focused]);

  const parsedDraft = Number.parseInt(draft, 10);
  const current = focused && Number.isFinite(parsedDraft) ? parsedDraft : value;

  const commit = (n: number) => {
    const next = clamp(Number.isFinite(n) ? Math.trunc(n) : value, min, max);
    setDraft(String(next));
    if (next !== value) onChange(next);
  };

  const step = (delta: number) => commit(current + delta);

  const canDecrease = !disabled && current > min;
  const canIncrease = !disabled && current < max;
  const bounded = max !== Number.MAX_SAFE_INTEGER;
  const maxLength = bounded ? String(max).length : 6;

  return (
    <View className={cn('flex-row items-start justify-center gap-6', className)}>
      <View className="pt-[5px]">
        <StepButton kind="decrease" disabled={!canDecrease} onPress={() => step(-1)} />
      </View>

      <View className="items-center gap-2">
        <View className="flex-row items-center gap-[5px]">
          <TextInput
            value={draft}
            onChangeText={(text) => setDraft(text.replace(/[^0-9]/g, ''))}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false);
              commit(Number.parseInt(draft, 10));
            }}
            onSubmitEditing={() => commit(Number.parseInt(draft, 10))}
            editable={!disabled}
            keyboardType="number-pad"
            returnKeyType="done"
            selectTextOnFocus
            maxLength={maxLength}
            accessibilityLabel={accessibilityLabel}
            accessibilityHint={
              bounded ? `Enter a number from ${min} to ${max}` : `Enter a number of at least ${min}`
            }
            className="font-ubuntu-medium text-[27px] text-[#113E55]"
            selectionColor="#113E55"
            style={{
              width: Math.max(1, draft.length) * DIGIT_WIDTH + 4,
              // 33pt row = Figma line height 32.8; lineHeight itself is left unset because
              // single-line iOS inputs mis-position text when it is applied.
              height: 33,
              padding: 0,
              textAlign: 'center',
              textAlignVertical: 'center',
              includeFontPadding: false,
              opacity: disabled ? 0.5 : 1,
            }}
          />
          {/* Static caret from the design; the native caret replaces it while typing. */}
          <View
            className="h-[23px] w-[2px]"
            style={{ backgroundColor: focused || disabled ? 'transparent' : '#878686' }}
          />
        </View>
        <Text className="font-inter-regular text-[11.2px] leading-[13.6px] text-[#878686]">
          {caption}
        </Text>
      </View>

      <View className="pt-[5px]">
        <StepButton kind="increase" disabled={!canIncrease} onPress={() => step(1)} />
      </View>
    </View>
  );
}
