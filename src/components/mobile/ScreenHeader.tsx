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
  containerClassName = 'mt-4',
}: ScreenHeaderProps) {
  return (
    <View className={containerClassName}>
      <Text style={sharedStyles.title}>{title}</Text>
      {subtitle ? (
        <Text className="mt-2 text-xs font-ubuntu-regular text-[#0A1F29]">{subtitle}</Text>
      ) : null}
    </View>
  );
}
