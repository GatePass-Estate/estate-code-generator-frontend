import { Pressable, Text, View } from 'react-native';
import InstitutionRadioOff from '@/src/assets/icons/institution-radio-off.svg';
import InstitutionRadioOn from '@/src/assets/icons/institution-radio-on.svg';
import type { Estate } from '@/src/features/admin/types/estate';
import { cn } from '@/src/shared/utils/cn';

type InstitutionResultCardProps = {
  estate: Estate;
  selected: boolean;
  onPress: (estate: Estate) => void;
};

export default function InstitutionResultCard({
  estate,
  selected,
  onPress,
}: InstitutionResultCardProps) {
  return (
    <Pressable
      onPress={() => onPress(estate)}
      className={cn(
        'flex-row items-center justify-between rounded-2xl border-[0.4px] border-[#CEE5ED] px-4 py-2',
        selected && 'bg-[#CEE5ED]'
      )}
    >
      <View className="flex-1 pr-3">
        <Text className="font-inter-light text-sm leading-[17px] text-[#0A1F29]">
          {estate.name}
        </Text>
        {!!estate.location && (
          <Text className="mt-0.5 font-inter-regular leading-[14px] text-caption text-[#878686]">
            {estate.location}
          </Text>
        )}
      </View>
      {selected ? <InstitutionRadioOn /> : <InstitutionRadioOff />}
    </Pressable>
  );
}
