import { type ReactNode } from 'react';
import { Text, View } from 'react-native';
import Back from '@/src/shared/components/navigation/Back';
import { cn } from '@/src/shared/utils/cn';

/** Space between the back control and the title — same on More, Register, etc. */
export const BACK_TO_TITLE_GAP = 12;
/** NativeWind class for {@link BACK_TO_TITLE_GAP}. */
export const BACK_TO_TITLE_GAP_CLASS = 'mt-3';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  /** Bell, profile, or other controls on the title row. */
  actions?: ReactNode;
  /** Renders the shared back button above the title. Defaults to going back. */
  showBack?: boolean;
  onBack?: () => void;
  /** Set when this header is not the first item on the screen, so it does not add the top inset again. */
  inset?: boolean;
  containerClassName?: string;
  titleClassName?: string;
  subtitleClassName?: string;
};

export default function ScreenHeader({
  title,
  subtitle,
  actions,
  showBack = false,
  onBack,
  inset = true,
  containerClassName,
  titleClassName,
  subtitleClassName,
}: ScreenHeaderProps) {
  // No onBack: Back's own default (useGoBack) navigates without Expo Router's warning.
  const back = showBack || onBack ? <Back type="short-arrow" onPress={onBack} /> : null;

  return (
    <View className={cn(inset && 'mt-[19px]', containerClassName)}>
      {back}
      <View className={cn('flex-col gap-3', back ? BACK_TO_TITLE_GAP_CLASS : undefined)}>
        <View className="flex-row items-center justify-between">
          <Text className={cn('text-[27px] font-ubuntu-medium text-primary', titleClassName)}>
            {title}
          </Text>
          {actions}
        </View>
        {subtitle ? (
          <Text className={cn('text-sm font-inter-light text-[#6C6C6C]', subtitleClassName)}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
