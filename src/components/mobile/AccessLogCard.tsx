import { View, Text, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ResidentAccessLog } from '@/src/types/accessLog';
import { formatAccessCodeWithSpace, formatGeneratedOnDate } from '@/src/lib/helpers';

type AccessLogCardProps = {
  log: ResidentAccessLog;
  onPress: () => void;
};

export function AccessLogCard({ log, onPress }: AccessLogCardProps) {
  const generatedLabel = formatGeneratedOnDate(new Date(log.generatedAt));

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-stretch justify-between rounded-[16px] bg-white px-4 py-2"
    >
      <View className="flex-1 gap-4 flex-col justify-between">
        <View className="">
          <Text className="text-[9px] font-ubuntu-medium text-[#6C6C6C]">Access Code</Text>

          <View className="relative self-start ">
            <Text className="text-[24px] font-ubuntu-medium text-[#0A1F29]">
              {formatAccessCodeWithSpace(log.code)}
            </Text>
            <View
              className="absolute -right-2 -top-0.5 h-2 w-2 rounded-full"
              style={{ backgroundColor: log.isActive ? '#46EE6A' : '#E30404' }}
            />
          </View>
        </View>

        <Text className="text-[9px] font-inter-regular text-[#6C6C6C]">
          Generated: {generatedLabel}
        </Text>
      </View>

      <View className=" flex-col items-end justify-between pt-1.5">
    
       <MaterialIcons name="keyboard-arrow-right" size={24} color="#113E55" />
      
        <Text
          className="text-[9px] font-inter-medium text-[#6C6C6C]"
          style={{ transform: [{ skewX: '-12deg' }] }}
        >
          {log.usageCount} Usage
        </Text>
      </View>
    </Pressable>
  );
}
