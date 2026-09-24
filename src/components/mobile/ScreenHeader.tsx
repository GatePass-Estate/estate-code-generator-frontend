import { Text, View } from 'react-native';
import { cn } from '@/src/lib/cn';
import HeaderActions from '@/src/components/mobile/HeaderActions';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  showActions?: boolean;
  containerClassName?: string;
  titleClassName?: string;
  subtitleClassName?: string;
};

export default function ScreenHeader({
  title,
  subtitle,
  showActions = false,
  containerClassName,
  titleClassName,
  subtitleClassName,
}: ScreenHeaderProps) {
  return (
    <View className={cn('mt-[19px] flex-col gap-2', containerClassName)}>
      <View className="flex-row items-center justify-between">
        <Text className={cn('text-[27px] font-ubuntu-medium text-[#113E55]', titleClassName)}>
          {title}
        </Text>
        {showActions ? <HeaderActions /> : null}
      </View>
      {subtitle ? (
        <Text className={cn('text-sm font-inter-light text-[#6C6C6C]', subtitleClassName)}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
