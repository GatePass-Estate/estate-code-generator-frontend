import { Text, View } from 'react-native';
import { WarningLineIcon } from '@/src/assets/svgs';

/** Figma 6649:8833 — resident free-plan notice. */
export default function FreePlanNotice() {
  return (
    <View
      className="items-center justify-center self-center rounded-[24px] bg-[#E5F6FF] p-2.5"
      style={{ gap: 10 }}
    >
      <WarningLineIcon width={24} height={24} color="#113E55" />
      <Text
        className="text-center font-inter-medium text-[#113E55]"
        style={{ width: 297, fontSize: 14, lineHeight: 18 }}
      >
        Not available on the Free Plan. Contact Admin to upgrade.
      </Text>
    </View>
  );
}
