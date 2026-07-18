import { View, Text } from 'react-native';
import { cn } from '@/src/lib/cn';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  containerClassName?: string;
  titleClassName?: string;
  subtitleClassName?: string;
};

export default function ScreenHeader({
  title,
  subtitle,
  containerClassName,
  titleClassName,
  subtitleClassName,
}: ScreenHeaderProps) {
  return (
    <View className={cn('mt-[19px] flex-col gap-2', containerClassName)}>
      <Text className={cn('text-[27px] font-ubuntu-medium text-[#113E55]', titleClassName)}>
        {title}
      </Text>
      {subtitle ? (
        <Text className={cn('text-sm font-inter-light text-[#6C6C6C]', subtitleClassName)}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
