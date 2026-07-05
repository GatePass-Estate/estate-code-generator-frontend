import { View, Text, ScrollView, Pressable } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useNavigation } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { sharedStyles } from '@/src/theme/styles';
import { ProfileAvatar } from '@/src/assets/svgs';
import { ReceiverType } from '@/src/types/codes';
import { GenderType } from '@/src/types/general';
import ProfilePreviewModal from '@/src/components/mobile/ProfilePreviewModal';

const capitalizeWords = (value: string) =>
  value
    ? value
        .split(' ')
        .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ''))
        .join(' ')
    : '';

const SectionDivider = ({ title, color }: { title: string; color: 'teal' | 'orange' }) => {
  const lineColor = color === 'teal' ? 'bg-teal' : 'bg-orange';
  const textColor = color === 'teal' ? 'text-teal' : 'text-orange';

  return (
    <View className="flex-row items-center my-5">
      <View className={`h-[1px] flex-1 ${lineColor}`} />
      <Text className={`mx-2.5 text-sm font-inter-semibold ${textColor}`}>{title}</Text>
      <View className={`h-[1px] flex-1 ${lineColor}`} />
    </View>
  );
};

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <View className=" flex-row items-center justify-between rounded-2xl bg-white px-4 py-3">
    <Text className="text-xs font-ubuntu-bold text-[#6C6C6C]">{label}</Text>
    <Text
      className="text-right text-xs font-ubuntu-light text-[#6C6C6C]"
      numberOfLines={2}
      ellipsizeMode="tail"
    >
      {value}
    </Text>
  </View>
);

export default function ValidationResult() {
  const navigation = useNavigation();
  const [showProfileModal, setShowProfileModal] = useState(false);
  let params = useLocalSearchParams();
  const code = String(params.code || '');
  const resident_name = String(params.resident_name || '');
  const resident_address = String(params.resident_address || '');
  const resident_email = String(params.resident_email || '');
  const resident_phone_number = String(params.resident_phone_number || '');
  const receiver = params.receiver as ReceiverType;
  const visitor_fullname = String(params.visitor_fullname || '');
  const gender = params.gender as GenderType;
  const relationship_with_resident = String(params.relationship_with_resident || '');

  const formattedGender = gender
    ? String(gender)
        .replace(/_/g, ' ')
        .split(' ')
        .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
        .join(' ')
    : '';

  const isGuest = receiver === 'visitor';

  return (
    <SafeAreaView
      style={[sharedStyles.container, sharedStyles.modalContainer, { backgroundColor: '#F6F7F7' }]}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <Pressable
        onPress={() => navigation.goBack()}
        className="h-[30px] w-[30px] items-center justify-center rounded-full bg-[#EFF1F1]"
      >
        <MaterialIcons name="keyboard-arrow-left" size={24} color="#113E55" />
      </Pressable>

      <ScrollView contentContainerClassName="px-1  mt-4 pb-10" showsVerticalScrollIndicator={false}>
        <View className="relative mt-8 items-center ">
          <Pressable
            className="absolute -top-7 z-10"
            onPress={() => setShowProfileModal(true)}
            accessibilityLabel="View profile"
          >
            <View className="h-[50px] w-[50px] items-center justify-center rounded-full bg-[#537B85]">
              <ProfileAvatar width={50} height={50} />
            </View>
          </Pressable>

          <View className="w-full items-center rounded-[40px] bg-white pb-2  pt-[30px] flex-col gap-2">
            <Text className="text-[9px] font-inter-semibold text-[#F46036]  mt-1">Access Code</Text>
            <Text className=" text-[50px] font-ubuntu-semibold uppercase  text-primary">
              {code.slice(0, 3)} {code.slice(3)}
            </Text>
          </View>
        </View>

        <View className=" mt-6">
          {isGuest && (
            <View className="mb-6 flex-col gap-3">
              <SectionDivider title="Guest Details" color="teal" />
              <DetailRow label="Name" value={capitalizeWords(visitor_fullname)} />
              <DetailRow label="Gender" value={formattedGender} />
              <DetailRow label="Relationship" value={capitalizeWords(relationship_with_resident)} />
            </View>
          )}

          <View>
            <SectionDivider title="Resident Details" color="orange" />
            <View className="flex-col gap-3 ">
              <DetailRow label="Name" value={capitalizeWords(resident_name)} />
              <DetailRow label="Address" value={resident_address} />
              <DetailRow label="Phone Number" value={resident_phone_number} />
              <DetailRow label="Email Address" value={resident_email} />
            </View>
          </View>
        </View>
      </ScrollView>

      <ProfilePreviewModal visible={showProfileModal} onClose={() => setShowProfileModal(false)} />
    </SafeAreaView>
  );
}
