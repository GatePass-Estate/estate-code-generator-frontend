import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';
import { cn } from '@/src/lib/cn';

/** Space below a screen CTA, above the home indicator. */
export const BUTTON_MARGIN_BOTTOM = 32;

type ButtonProps = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: 'primary' | 'secondary';
  size?: 'lg' | 'md';
  loading?: boolean;
};

const SIZE_CLASS = {
  lg: 'w-[278px] max-w-[278px] min-w-[80px]',
  md: 'w-[155px] min-w-[80px]',
} as const;

export default function Button({
  label,
  variant = 'primary',
  size = 'lg',
  loading = false,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const isDisabled = Boolean(disabled || loading);
  const mutedPrimary = variant === 'primary' && isDisabled && !loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      className={cn(
        'items-center justify-center overflow-hidden rounded-[24px] py-4',
        SIZE_CLASS[size],
        variant === 'secondary' ? 'px-6' : 'px-8',
        variant === 'secondary'
          ? 'bg-[#E5F6FF]'
          : mutedPrimary
            ? 'border-0 bg-[#C0C0C0]'
            : 'border border-[#113E55] bg-[#113E55]',
        className
      )}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#F6F7F7' : '#113E55'} />
      ) : (
        <Text
          className="text-center text-sm font-ubuntu-semibold tracking-[-0.24px]"
          style={{
            fontSize: 14,
            lineHeight: 17,
            letterSpacing: -0.24,
            color: mutedPrimary ? '#878686' : variant === 'primary' ? '#F6F7F7' : '#113E55',
          }}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
