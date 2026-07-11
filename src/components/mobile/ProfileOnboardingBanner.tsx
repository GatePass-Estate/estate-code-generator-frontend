import { View, Text, Pressable } from 'react-native';

type ProfileOnboardingBannerProps = {
  title: string;
  description: string;
  onUpload: () => void;
};

export function ProfileOnboardingBanner({
  title,
  description,
  onUpload,
}: ProfileOnboardingBannerProps) {
  return (
    <View className="mb-[30px]  pt-12 w-full items-center">
      <Text className="text-center text-[27px] font-ubuntu-medium text-[#0A1F29] ">
        {title}
      </Text>
      <Text className="mt-2 text-center text-sm font-inter-light  w-[292px] text-[#6C6C6C]">
        {description}
      </Text>
      <Pressable
        onPress={onUpload}
        className="mt-10 w-[278px] items-center justify-center rounded-full bg-[#113E55] border border-[#113E55] py-4"
      >
        <Text className="text-sm font-ubuntu-semibold text-white">Upload</Text>
      </Pressable>
    </View>
  );
}

export type ProfileOnboardingStep = 'id' | 'photo' | null;

export function getProfileOnboardingStep(
  hasIdentification: boolean,
  hasPhoto: boolean
): ProfileOnboardingStep {
  if (!hasIdentification) return 'id';
  if (!hasPhoto) return 'photo';
  return null;
}
