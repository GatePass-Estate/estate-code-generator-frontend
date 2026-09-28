import { useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

type CodeInputProps = {
  value: string;
  onChange: (next: string) => void;
  length?: number;
  autoFocus?: boolean;
  editable?: boolean;
  onSubmit?: () => void;
};

/**
 * Segmented code entry matching the Figma boxes.
 *
 * A single transparent TextInput sits over the boxes rather than one input per
 * digit: that keeps paste, autofill (one-time-code) and backspace behaving
 * natively on both iOS/Android and web, which per-box inputs notoriously break.
 */
export default function CodeInput({
  value,
  onChange,
  length = 6,
  autoFocus = true,
  editable = true,
  onSubmit,
}: CodeInputProps) {
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);

  const digits = Array.from({ length }, (_, index) => value[index] ?? '');
  // The caret sits on the first empty box, or the last box once full.
  const activeIndex = Math.min(value.length, length - 1);

  return (
    <Pressable onPress={() => inputRef.current?.focus()} className="relative">
      <View className="flex-row justify-center gap-2">
        {digits.map((digit, index) => {
          const isActive = focused && index === activeIndex && editable;
          return (
            <View
              key={index}
              className="bg-light-teal rounded-[8px] items-center justify-center"
              style={{
                width: 44,
                height: 56,
                // Border is always present and only changes colour, so the
                // boxes do not shift by a pixel when focus moves.
                borderWidth: 1,
                borderColor: isActive ? '#113E55' : 'transparent',
              }}
            >
              <Text className="text-primary font-ubuntu-medium" style={{ fontSize: 28 }}>
                {digit}
              </Text>
            </View>
          );
        })}
      </View>

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(next) => onChange(next.replace(/[^0-9]/g, '').slice(0, length))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onSubmitEditing={onSubmit}
        editable={editable}
        autoFocus={autoFocus}
        keyboardType="number-pad"
        inputMode="numeric"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={length}
        caretHidden
        // Transparent overlay so taps land on the real input while the styled
        // boxes above remain what the user sees.
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0,
        }}
      />
    </Pressable>
  );
}
