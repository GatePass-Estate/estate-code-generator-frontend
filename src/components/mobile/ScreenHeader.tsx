import { View, Text } from 'react-native';
import { sharedStyles } from '@/src/theme/styles';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  containerClassName?: string;
};

export default function ScreenHeader({
  title,
  subtitle,
  containerClassName = 'mt-[19px]',
}: ScreenHeaderProps) {
  return (
    <View className={containerClassName}>
      <Text className='text-[21px] leading-6 font-ubuntu-semibold text-[#113E55]'>{title}</Text>
      {subtitle ? (
        <Text className="mt-2 text-xs font-ubuntu-regular text-[#0A1F29] leading-[14px]">{subtitle}</Text>
      ) : null}
    </View>
  );
}
