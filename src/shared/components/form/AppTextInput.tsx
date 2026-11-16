import { forwardRef } from 'react';
import { Platform, TextInput, type TextInputProps } from 'react-native';
import { cn } from '@/src/shared/utils/cn';

/** Default body size for single-line fields across GatePass. */
export const APP_TEXT_INPUT_FONT_SIZE = 14;
/** Must be taller than the font — equal line-height clips placeholders on Android. */
export const APP_TEXT_INPUT_LINE_HEIGHT = 18;

export type AppTextInputProps = TextInputProps & {
  className?: string;
};

/**
 * Shared text field. Use this instead of raw `TextInput` so placeholder/value
 * leading stays consistent and Android does not clip glyphs.
 *
 * Single-line defaults: 14/18, vertically centered, no extra font padding.
 * Multiline keeps top alignment and does not force `paddingVertical: 0`.
 */
const AppTextInput = forwardRef<TextInput, AppTextInputProps>(function AppTextInput(
  {
    className,
    style,
    multiline = false,
    placeholderTextColor = '#878686',
    textAlignVertical,
    ...props
  },
  ref
) {
  return (
    <TextInput
      ref={ref}
      {...props}
      multiline={multiline}
      placeholderTextColor={placeholderTextColor}
      textAlignVertical={textAlignVertical ?? (multiline ? 'top' : 'center')}
      className={cn('font-inter-light text-[14px] leading-[18px] text-primary', className)}
      style={[
        {
          fontSize: APP_TEXT_INPUT_FONT_SIZE,
          lineHeight: APP_TEXT_INPUT_LINE_HEIGHT,
          ...(multiline ? null : { paddingVertical: 0 }),
          ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
        },
        style,
      ]}
    />
  );
});

export default AppTextInput;
