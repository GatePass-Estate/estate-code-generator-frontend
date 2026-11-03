import { useEffect, useId, useRef, useState } from 'react';
import {
  InputAccessoryView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { cn } from '@/src/lib/cn';

export type SeatStepperProps = {
  value: number;
  /**
   * Always called with an integer within [min, max]: on −/+ press, on every keystroke whose
   * typed number is in range, and on blur/submit/Done (out-of-range input snaps to the bound).
   */
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
const CARET_COLOR = '#878686';
// Ubuntu Sans 500 @ 27.34pt: Figma sizes "1200" at 62pt, i.e. ~15.5pt per digit.
const DIGIT_WIDTH = 16;
// Extra room beyond the measured text so a newly typed digit never overflows (and makes iOS
// scroll the field) during the frame before the text is re-measured. Also hosts the fake caret.
const INPUT_SLACK = DIGIT_WIDTH;
const CARET_GAP = 3;
const CARET_WIDTH = 2;
const NUMBER_HEIGHT = 33;

// Classic caret rhythm: ~500ms on / ~500ms off, with a very short fade on each edge.
const BLINK_HOLD_MS = 420;
const BLINK_FADE_MS = 80;

const NUMBER_TEXT_CLASS = 'font-ubuntu-medium text-[27px] text-[#113E55]';

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

/** Text-box style blinking caret (shown while the field is idle; the native caret takes over on focus). */
function BlinkingCaret({ left }: { left: number }) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    // Functional affordance (like the native caret), so it keeps blinking with Reduce Motion on.
    const fade = {
      duration: BLINK_FADE_MS,
      easing: Easing.linear,
      reduceMotion: ReduceMotion.Never,
    };
    opacity.value = withRepeat(
      withSequence(
        ReduceMotion.Never,
        withDelay(BLINK_HOLD_MS, withTiming(0, fade), ReduceMotion.Never),
        withDelay(BLINK_HOLD_MS, withTiming(1, fade), ReduceMotion.Never)
      ),
      -1,
      false,
      undefined,
      ReduceMotion.Never
    );
    return () => cancelAnimation(opacity);
  }, [opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left,
          top: (NUMBER_HEIGHT - 23) / 2,
          width: CARET_WIDTH,
          height: 23,
          backgroundColor: CARET_COLOR,
        },
        style,
      ]}
    />
  );
}

/**
 * −  1200|  +  seat picker from the Choose Plan / Manage Seats designs.
 * The number is a real number-pad TextInput: tapping it selects the number so typing replaces
 * it. In-range values are reported live while typing; the field is clamped and committed on
 * blur / Done. The grey pipe is a caret that blinks while idle; on focus the native caret
 * (same colour) takes over.
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
  const inputRef = useRef<TextInput>(null);
  const accessoryId = `seat-stepper-${useId()}`;
  // Only meaningful while focused; when idle the field always shows `value`, so external changes
  // are reflected immediately and there is no draft/value hand-off to flicker on blur.
  const [draft, setDraft] = useState(String(value));
  const [focused, setFocused] = useState(false);
  const [textWidth, setTextWidth] = useState<number | null>(null);

  const text = focused ? draft : String(value);
  const parsedDraft = Number.parseInt(draft, 10);
  const current = focused && Number.isFinite(parsedDraft) ? parsedDraft : value;

  const measuredWidth = textWidth ?? Math.max(1, text.length) * DIGIT_WIDTH;
  const slotWidth = Math.ceil(measuredWidth) + INPUT_SLACK;

  const commit = (n: number) => {
    const next = clamp(Number.isFinite(n) ? Math.trunc(n) : value, min, max);
    setDraft(String(next));
    if (next !== value) onChange(next);
  };

  const handleChangeText = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, '');
    setDraft(digits);
    const n = Number.parseInt(digits, 10);
    // Live update for in-range numbers; anything else waits for blur to be clamped.
    if (Number.isFinite(n) && n >= min && n <= max && n !== value) onChange(n);
  };

  const handleFocus = () => {
    setDraft(String(value));
    setFocused(true);
  };

  const handleBlur = () => {
    setFocused(false);
    commit(Number.parseInt(draft, 10));
  };

  const step = (delta: number) => commit(current + delta);

  const onMeasure = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    setTextWidth((prev) => (prev !== null && Math.abs(prev - width) < 0.5 ? prev : width));
  };

  const canDecrease = !disabled && current > min;
  const canIncrease = !disabled && current < max;
  const bounded = max !== Number.MAX_SAFE_INTEGER;
  const maxLength = bounded ? String(max).length : 6;
  const showFakeCaret = !focused && !disabled;

  return (
    <View className={cn('flex-row items-start justify-center gap-6', className)}>
      {/* Invisible twin of the number (same font) used to size the input to its content. */}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: 0, top: 0, opacity: 0 }}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Text className={NUMBER_TEXT_CLASS} numberOfLines={1} onLayout={onMeasure}>
          {text || '0'}
        </Text>
      </View>

      <View className="pt-[5px]">
        <StepButton kind="decrease" disabled={!canDecrease} onPress={() => step(-1)} />
      </View>

      <View className="items-center gap-2">
        <View style={{ width: slotWidth, height: NUMBER_HEIGHT }}>
          <TextInput
            ref={inputRef}
            value={text}
            onChangeText={handleChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onSubmitEditing={() => inputRef.current?.blur()}
            editable={!disabled}
            keyboardType="number-pad"
            returnKeyType="done"
            selectTextOnFocus
            maxLength={maxLength}
            inputAccessoryViewID={Platform.OS === 'ios' ? accessoryId : undefined}
            accessibilityLabel={accessibilityLabel}
            accessibilityHint={
              bounded ? `Enter a number from ${min} to ${max}` : `Enter a number of at least ${min}`
            }
            className={NUMBER_TEXT_CLASS}
            // iOS tints the native caret (and a translucent selection) with this colour.
            selectionColor={Platform.OS === 'ios' ? CARET_COLOR : '#CEE5ED'}
            cursorColor={CARET_COLOR}
            selectionHandleColor="#113E55"
            style={{
              width: slotWidth,
              // 33pt row = Figma line height 32.8; lineHeight itself is left unset because
              // single-line iOS inputs mis-position text when it is applied.
              height: NUMBER_HEIGHT,
              padding: 0,
              textAlign: 'center',
              textAlignVertical: 'center',
              includeFontPadding: false,
              opacity: disabled ? 0.5 : 1,
            }}
          />
          {showFakeCaret ? (
            <BlinkingCaret left={(slotWidth + measuredWidth) / 2 + CARET_GAP} />
          ) : null}
        </View>
        <Text className="font-inter-regular text-[11.2px] leading-[13.6px] text-[#878686]">
          {caption}
        </Text>
      </View>

      <View className="pt-[5px]">
        <StepButton kind="increase" disabled={!canIncrease} onPress={() => step(1)} />
      </View>

      {Platform.OS === 'ios' ? (
        <InputAccessoryView nativeID={accessoryId} backgroundColor="#F6F7F7">
          <View className="flex-row justify-end border-t border-[#E3E6E8] bg-[#F6F7F7] px-4 py-2">
            <Pressable
              onPress={() => inputRef.current?.blur()}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Done"
              className="px-2 py-1 active:opacity-60"
            >
              <Text className="font-inter-medium text-[16px] leading-[19.4px] text-[#113E55]">
                Done
              </Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      ) : null}
    </View>
  );
}
