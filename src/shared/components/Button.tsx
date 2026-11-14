import { useRef, type ReactNode } from 'react';
import { Platform, Pressable, Text, type PressableProps } from 'react-native';
import { CircleLoader } from '@/src/shared/components/feedback/ScreenLoading';
import { cn } from '@/src/shared/utils/cn';

/** Space below a screen CTA, above the home indicator. */
export const BUTTON_MARGIN_BOTTOM = 32;

type ButtonProps = Omit<PressableProps, 'children'> & {
  label: string;
  /** Shown before the label. The button then hugs its content instead of using a fixed width. */
  icon?: ReactNode;
  /** `danger`: orange (#F46036, the seat-usage bar colour) for destructive actions. */
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'lg' | 'md';
  loading?: boolean;
};

const SIZE_CLASS = {
  lg: 'w-[278px] max-w-[278px] min-w-[80px]',
  md: 'w-[155px] min-w-[80px]',
} as const;

export default function Button({
  label,
  icon,
  variant = 'primary',
  size = 'lg',
  loading = false,
  disabled,
  className,
  onPress,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = Boolean(disabled || loading);
  const mutedPrimary = variant === 'primary' && isDisabled && !loading;
  const lastPressAt = useRef(0);
  const handlePress: PressableProps['onPress'] = (event) => {
    if (Platform.OS === 'android') {
      const now = Date.now();
      if (now - lastPressAt.current < 700) return;
      lastPressAt.current = now;
    }
    onPress?.(event);
  };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      className={cn(
        'items-center justify-center overflow-hidden rounded-[24px] py-4',
        icon
          ? 'h-[44px] w-auto max-w-none flex-row gap-1 rounded-full px-4 py-0'
          : SIZE_CLASS[size],
        icon ? null : variant === 'secondary' ? 'px-6' : 'px-8',
        variant === 'secondary'
          ? 'bg-[#E5F6FF]'
          : variant === 'danger'
            ? 'border border-orange bg-orange'
            : mutedPrimary
              ? 'border-0 bg-[#C0C0C0]'
              : 'border border-primary bg-primary',
        className
      )}
      {...props}
      style={
        icon
          ? (state) => [
              { height: 44, paddingVertical: 0 },
              typeof style === 'function' ? style(state) : style,
            ]
          : style
      }
      onPress={handlePress}
    >
      {loading ? (
        <CircleLoader size={22} tone={variant === 'secondary' ? 'navy' : 'light'} />
      ) : (
        <>
          {icon}
          <Text
            allowFontScaling={false}
            className="text-center text-sm font-ubuntu-semibold tracking-[-0.24px]"
            style={{
              fontSize: 14,
              lineHeight: 17,
              letterSpacing: -0.24,
              color: mutedPrimary ? '#878686' : variant === 'secondary' ? '#113E55' : '#F6F7F7',
            }}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}
