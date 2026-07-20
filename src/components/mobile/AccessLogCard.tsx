import { View, Text, Pressable } from 'react-native';
import { NavigateNextIcon } from '@/src/assets/svgs';
import { ResidentAccessLog } from '@/src/types/accessLog';
import { formatAccessCodeWithSpace, formatGeneratedOnDate, parseLogDate } from '@/src/lib/helpers';

type AccessLogCardProps = {
  log: ResidentAccessLog;
  onPress: () => void;
};

export function AccessLogCard({ log, onPress }: AccessLogCardProps) {
  const generatedLabel = formatGeneratedOnDate(parseLogDate(log.generatedAt));

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-stretch justify-between rounded-[16px] bg-white px-4 py-2"
    >
      <View className="flex-1 gap-2 flex-col justify-between">
        <View className="">
          <Text className="text-[8.96px] font-inter-medium text-[#6C6C6C] mb-[5px]">
            Access Code
          </Text>

          <View className="relative self-start ">
            <Text className="text-[27.34px] font-ubuntu-medium text-[#0A1F29]">
              {formatAccessCodeWithSpace(log.code)}
            </Text>
            <View
              className="absolute right-[5px] -top-3 h-2 w-2 rounded-full"
              style={{ backgroundColor: log.isActive ? '#46EE6A' : '#E30404' }}
            />
          </View>
        </View>

        <Text className="text-[11.2px] font-inter-regular text-[#6C6C6C]">
          Generated: {generatedLabel}
        </Text>
      </View>

      <View className="flex-col items-end justify-between pt-[14px]">
        <NavigateNextIcon width={24} height={24} />

        <Text className="text-[8.96px] font-inter-medium text-[#6C6C6C]">
          {log.usageCount} Usage
        </Text>
      </View>
    </Pressable>
  );
}
