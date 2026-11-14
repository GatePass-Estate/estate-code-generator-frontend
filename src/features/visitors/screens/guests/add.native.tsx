import { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, ScrollView } from 'react-native';
import BottomSheet from '@/src/shared/components/feedback/BottomSheet';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCreateGuest } from '@/src/features/visitors/hooks/guests';
import { useUserStore } from '@/src/store/userStore';
import { GenderType, RelationshipType } from '@/src/shared/types/general';
import { sharedStyles } from '@/src/shared/theme/styles';
import { useAndroidBottomInset } from '@/src/shared/hooks/useAndroidBottomInset';
import { CheckRingIcon, ExpandMoreIcon } from '@/src/assets/svgs';
import Button, { BUTTON_MARGIN_BOTTOM } from '@/src/shared/components/Button';
import { PlanNoticeSlot } from '@/src/features/billing/components/FreePlanNotice';
import ScreenHeader from '@/src/shared/components/layout/ScreenHeader';
import HeaderActions from '@/src/features/dashboard/components/HeaderActions';
import { useFeatureGate } from '@/src/features/billing/hooks/usePlan';

const GENDER_OPTIONS: { label: string; value: Exclude<GenderType, null> }[] = [
  { label: 'Female', value: 'female' },
  { label: 'Male', value: 'male' },
  { label: "I'd prefer not to say", value: 'prefer_not_to_say' },
];

const RELATIONSHIP_OPTIONS: { label: string; value: Exclude<RelationshipType, null> }[] = [
  { label: 'Partner', value: 'partner' },
  { label: 'Friend', value: 'friend' },
  { label: 'Family', value: 'family' },
  { label: 'Taxi', value: 'taxi' },
  { label: 'Delivery', value: 'delivery' },
  { label: 'Technician', value: 'technician' },
  { label: 'Other', value: 'other' },
];

const AddGuestMobile = () => {
  const { tabContentPadding } = useAndroidBottomInset();
  const [guestName, setGuestName] = useState('');
  const [relationship, setRelationship] = useState<RelationshipType>(null);
  const [gender, setGender] = useState<GenderType>(null);
  const [genderSheetVisible, setGenderSheetVisible] = useState(false);
  const [relationshipSheetVisible, setRelationshipSheetVisible] = useState(false);
  const [addToGuestList, setAddToGuestList] = useState(false);
  const [savingGuest, setSavingGuest] = useState(false);
  const createGuestMutation = useCreateGuest();
  const saveGuestGate = useFeatureGate('guest_management');

  const genderLabel = GENDER_OPTIONS.find((option) => option.value === gender)?.label;
  const relationshipLabel = RELATIONSHIP_OPTIONS.find(
    (option) => option.value === relationship
  )?.label;
  const router = useRouter();

  const inputChecks = (): boolean => {
    if (guestName.trim() === '') {
      Alert.alert('Error', "Please enter the guest's name.");
      return false;
    }

    if (relationship == null) {
      Alert.alert('Error', 'Please select your relationship with the guest.');
      return false;
    }

    if (gender == null) {
      Alert.alert('Error', 'Please select a gender.');
      return false;
    }

    return true;
  };

  function handleContinue() {
    if (savingGuest) return;
    if (!inputChecks()) return;

    router.push({
      pathname: '/user/history/duration',
      params: {
        visitorName: guestName.trim(),
        relationship: relationship as string,
        gender: gender as string,
        saveGuest: addToGuestList && saveGuestGate.allowed ? 'true' : 'false',
      },
    });
  }

  async function handleSaveGuest() {
    if (!inputChecks()) return;
    if (!saveGuestGate.requestAccess()) return;

    setSavingGuest(true);
    try {
      await createGuestMutation.mutateAsync({
        resident_id: useUserStore.getState().user_id,
        guest_name: guestName.trim(),
        relationship: relationship as RelationshipType,
        gender: gender as GenderType,
      });

      setGuestName('');
      setRelationship(null);
      setGender(null);
      setAddToGuestList(false);

      router.push({
        pathname: '/user/guests',
        params: {
          refresh: 'true',
        },
      });
    } catch {
      Alert.alert('Error', 'Failed to save guest. Please try again.');
    } finally {
      setSavingGuest(false);
    }
  }

  return (
    <SafeAreaView
      style={[sharedStyles.container, { backgroundColor: '#F6F7F7' }]}
      edges={['top', 'left', 'right']}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: tabContentPadding,
        }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Add Guest"
          subtitle="Fill in your guest information"
          actions={<HeaderActions />}
          titleClassName="text-heading"
          subtitleClassName="text-[#878686]"
          containerClassName="mb-[19px]"
        />

        <View style={{ gap: 19 }}>
          <View className="gap-2">
            <Text className="text-2xs font-inter-medium text-[#878686]">Name</Text>
            <TextInput
              className="rounded-[16px] bg-[#EFF1F1] px-4 py-4 font-inter-light text-primary"
              style={{ fontSize: 14 }}
              placeholder="Enter Guest Name..."
              placeholderTextColor="#878686"
              value={guestName}
              onChangeText={setGuestName}
            />
          </View>

          <View className="gap-2">
            <Text className="text-2xs font-inter-medium text-[#878686]">Gender</Text>
            <Pressable
              onPress={() => setGenderSheetVisible(true)}
              className="flex-row items-center justify-between rounded-[16px] bg-[#EFF1F1] px-4 py-4"
            >
              <Text
                className={`text-sm font-inter-light ${genderLabel ? 'text-primary' : 'text-[#878686]'}`}
              >
                {genderLabel ?? 'Select the gender of your guest'}
              </Text>
              <ExpandMoreIcon width={24} height={24} color="#9B9797" />
            </Pressable>
          </View>

          <View className="gap-2">
            <Text className="text-2xs font-inter-medium text-[#878686]">Relationship</Text>
            <Pressable
              onPress={() => setRelationshipSheetVisible(true)}
              className="flex-row items-center justify-between rounded-[16px] bg-[#EFF1F1] px-4 py-4"
            >
              <Text
                className={`text-sm font-inter-light ${relationshipLabel ? 'text-primary' : 'text-[#878686]'}`}
              >
                {relationshipLabel ?? 'Select the relationship with your guest'}
              </Text>
              <ExpandMoreIcon width={24} height={24} color="#9B9797" />
            </Pressable>
          </View>
        </View>

        <Pressable
          onPress={() => {
            if (!saveGuestGate.requestAccess()) return;
            setAddToGuestList((prev) => !prev);
          }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: addToGuestList && saveGuestGate.allowed }}
          className="mt-[19px] h-10 flex-row items-center gap-[10px] self-start"
        >
          <View className="h-6 w-6 items-center justify-center overflow-hidden">
            <MaterialIcons
              name={
                addToGuestList && saveGuestGate.allowed ? 'check-box' : 'check-box-outline-blank'
              }
              size={24}
              color="#113E55"
            />
          </View>
          <Text
            className="mt-1 text-caption font-inter-semibold leading-[14px] text-primary"
            style={{ includeFontPadding: false }}
          >
            Add to Guest List
          </Text>
        </Pressable>

        <View className="mt-[90px]" style={{ paddingBottom: BUTTON_MARGIN_BOTTOM }}>
          <PlanNoticeSlot {...saveGuestGate.noticeProps}>
            <View className="flex-row items-center justify-between">
              <Button
                label="Save Guest"
                variant="secondary"
                size="md"
                loading={savingGuest}
                onPress={handleSaveGuest}
              />
              <Button label="Continue" size="md" onPress={handleContinue} />
            </View>
          </PlanNoticeSlot>
        </View>

        <BottomSheet
          visible={genderSheetVisible}
          onClose={() => setGenderSheetVisible(false)}
          scrimClassName="flex-1 justify-end bg-black/30"
          panelClassName="rounded-t-[40px] bg-[#F6F7F7] pb-10"
        >
          <View className="px-5 pb-4 pt-4">
            <Text className="mb-6 text-center text-heading-sm font-ubuntu-semibold text-primary">
              Gender
            </Text>
            <View className="gap-2">
              {GENDER_OPTIONS.map((option) => {
                const selected = gender === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      setGender(option.value);
                      setGenderSheetVisible(false);
                    }}
                    className="h-12 w-full flex-row items-center justify-between rounded-2xl bg-[#EFF1F1] px-4"
                  >
                    <Text className="text-sm font-inter-light text-primary">{option.label}</Text>
                    {selected ? (
                      <View className="h-6 w-6 items-center justify-center">
                        <CheckRingIcon />
                      </View>
                    ) : (
                      <View className="h-6 w-6" />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </BottomSheet>

        <BottomSheet
          visible={relationshipSheetVisible}
          onClose={() => setRelationshipSheetVisible(false)}
          scrimClassName="flex-1 justify-end bg-black/30"
          panelClassName="rounded-t-[40px] bg-[#F6F7F7] pb-10"
        >
          <View className="px-5 pb-4 pt-4">
            <Text className="mb-6 text-center text-heading-sm font-ubuntu-semibold text-primary">
              Relationship
            </Text>
            <View className="gap-2">
              {RELATIONSHIP_OPTIONS.map((option) => {
                const selected = relationship === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      setRelationship(option.value);
                      setRelationshipSheetVisible(false);
                    }}
                    className="h-12 w-full flex-row items-center justify-between rounded-2xl bg-[#EFF1F1] px-4"
                  >
                    <Text className="text-sm font-inter-light text-primary">{option.label}</Text>
                    {selected ? (
                      <View className="h-6 w-6 items-center justify-center">
                        <CheckRingIcon />
                      </View>
                    ) : (
                      <View className="h-6 w-6" />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </BottomSheet>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AddGuestMobile;
