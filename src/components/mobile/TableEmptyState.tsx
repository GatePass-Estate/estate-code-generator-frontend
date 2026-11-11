import { type ReactNode } from 'react';
import { Text, View } from 'react-native';

type TableEmptyStateProps = {
  icon: ReactNode;
  title: string;
  subtitle: string;
};

/** Empty copy for result-page tables (incident reports, anomaly rankings). */
export default function TableEmptyState({ icon, title, subtitle }: TableEmptyStateProps) {
  return (
    <View className="items-center justify-center px-4 py-8">
      <View className="h-12 w-12 items-center justify-center rounded-full bg-[#EFF1F1]">
        {icon}
      </View>
      <Text
        allowFontScaling={false}
        className="mt-4 text-center text-[14px] font-inter-medium text-[#113E55]"
      >
        {title}
      </Text>
      <Text
        allowFontScaling={false}
        className="mt-1 text-center text-[11.2px] font-inter-regular leading-[16px] text-[#878686]"
      >
        {subtitle}
      </Text>
    </View>
  );
}
