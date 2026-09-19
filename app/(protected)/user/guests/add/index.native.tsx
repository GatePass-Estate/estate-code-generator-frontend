import { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, ScrollView, Modal } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createGuest } from '@/src/lib/api/guests';
import { useUserStore } from '@/src/lib/stores/userStore';
import { GenderType, RelationshipType } from '@/src/types/general';
import { sharedStyles } from '@/src/theme/styles';
import { useAndroidBottomInset } from '@/src/hooks/useAndroidBottomInset';
import { CheckIcon, CheckRingIcon, ExpandMoreIcon } from '@/src/assets/svgs';
import Button, { BUTTON_MARGIN_BOTTOM } from '@/src/components/mobile/Button';
import { PlanNoticeSlot } from '@/src/components/mobile/FreePlanNotice';
import ScreenHeader from '@/src/components/mobile/ScreenHeader';
import { usePlan } from '@/src/hooks/usePlan';
import { PLAN_FEATURES } from '@/src/lib/plans';

const GENDER_OPTIONS: { label: string; value: Exclude<GenderType, null> }[] = [
  { label: 'Female', value: 'female' },
  { label: 'Male', value: 'male' },
  { label: "I'd prefer not to say", value: 'prefer_not_to_say' },
];

const PLAN_NOTICE_MS = 3000;

const AddGuestMobile = () => {
  const { tabContentPadding } = useAndroidBottomInset();
  const [guestName, setGuestName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [gender, setGender] = useState<GenderType>(null);
  const [genderSheetVisible, setGenderSheetVisible] = useState(false);
  const [addToGuestList, setAddToGuestList] = useState(false);
  const [running, setRunning] = useState<boolean>(false);
  const [showPlanNotice, setShowPlanNotice] = useState(false);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { canUse, isAdmin, requestFeature } = usePlan();
  const canSaveGuest = canUse(PLAN_FEATURES.save_guest_contact);

  const genderLabel = GENDER_OPTIONS.find((option) => option.value === gender)?.label;
  const router = useRouter();

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    };
  }, []);

  const flashPlanNotice = () => {
    setShowPlanNotice(true);
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = setTimeout(() => setShowPlanNotice(false), PLAN_NOTICE_MS);
  };

  const guardSaveGuest = (): boolean => {
    if (requestFeature(PLAN_FEATURES.save_guest_contact, { present: isAdmin })) return true;
    if (!isAdmin) flashPlanNotice();
    return false;
  };

  const inputChecks = (): boolean => {
    if (guestName.trim() === '') {
      Alert.alert('Error', "Please enter the guest's name.");
      return false;
    }

    if (relationship.trim() === '') {
      Alert.alert('Error', 'Please enter your relationship with the guest.');
      return false;
    }

    if (gender == null) {
      Alert.alert('Error', 'Please select a gender.');
      return false;
    }

    return true;
  };

  function handleContinue() {
    if (!inputChecks()) return;

    router.push({
      pathname: '/user/history/duration',
      params: {
        visitorName: guestName.trim(),
        relationship: relationship.trim(),
        gender: gender as string,
        saveGuest: addToGuestList && canSaveGuest ? 'true' : 'false',
      },
    });
  }

  async function handleSaveGuest() {
    if (!inputChecks()) return;
    if (!guardSaveGuest()) return;

    setRunning(true);
    try {
      await createGuest({
        resident_id: useUserStore.getState().user_id,
        guest_name: guestName.trim(),
        relationship: relationship.trim() as RelationshipType,
        gender: gender as GenderType,
      });

      setGuestName('');
      setRelationship('');
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
      setRunning(false);
    }
  }

  return (
    <SafeAreaView
      style={[sharedStyles.container, { backgroundColor: '#F6F7F7' }]}
      edges={['top', 'left', 'right']}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: tabContentPadding }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Add Guest"
          subtitle="Fill in your guest information"
          showActions
          titleClassName="text-[27.34px]"
          subtitleClassName="text-[#878686]"
          containerClassName="mb-[19px]"
        />

        <View style={{ gap: 19 }}>
          <View className="gap-2">
            <Text className="text-[8.96px] font-inter-medium text-[#878686]">Name</Text>
            <TextInput
              className="rounded-[16px] bg-[#EFF1F1] px-4 py-4 font-inter-light text-[#113E55]"
              style={{ fontSize: 14 }}
              placeholder="Enter Guest Name..."
              placeholderTextColor="#878686"
              value={guestName}
              onChangeText={setGuestName}
            />
          </View>

          <View className="gap-2">
            <Text className="text-[8.96px] font-inter-medium text-[#878686]">Gender</Text>
            <Pressable
              onPress={() => setGenderSheetVisible(true)}
              className="flex-row items-center justify-between rounded-[16px] bg-[#EFF1F1] px-4 py-4"
            >
              <Text
                className={`text-sm font-inter-light ${genderLabel ? 'text-[#113E55]' : 'text-[#878686]'}`}
              >
                {genderLabel ?? 'Select the gender of your guest'}
              </Text>
              <ExpandMoreIcon width={24} height={24} color="#9B9797" />
            </Pressable>
          </View>

          <View className="gap-2">
            <Text className="text-[8.96px] font-inter-medium text-[#878686]">Relationship</Text>
            <TextInput
              className="rounded-[16px] bg-[#EFF1F1] px-4 py-4 font-inter-light text-[#113E55]"
              style={{ fontSize: 14 }}
              placeholder="Enter your relationship with guest"
              placeholderTextColor="#878686"
              value={relationship}
              onChangeText={setRelationship}
            />
          </View>
        </View>

        <Pressable
          onPress={() => {
            if (!guardSaveGuest()) return;
            setAddToGuestList((prev) => !prev);
          }}
          className="mt-[19px] h-10 flex-row items-center gap-1.5 self-start"
        >
          <View className="h-4 w-4 items-center justify-center rounded-[3px] border border-[#113E55]">
            {addToGuestList && canSaveGuest ? <CheckIcon /> : null}
          </View>
          <Text className="text-[11.2px] font-inter-semibold text-[#113E55]">
            Add to Guest List
          </Text>
        </Pressable>

        <View className="mt-[90px]" style={{ paddingBottom: BUTTON_MARGIN_BOTTOM }}>
          <PlanNoticeSlot visible={showPlanNotice}>
            <View className="flex-row items-center justify-between">
              <Button
                label="Save Guest"
                variant="secondary"
                size="md"
                loading={running}
                onPress={handleSaveGuest}
              />
              <Button label="Continue" size="md" loading={running} onPress={handleContinue} />
            </View>
          </PlanNoticeSlot>
        </View>

        <Modal
          transparent
          visible={genderSheetVisible}
          animationType="slide"
          onRequestClose={() => setGenderSheetVisible(false)}
        >
          <Pressable
            className="flex-1 justify-end bg-black/30"
            onPress={() => setGenderSheetVisible(false)}
          >
            <Pressable className="rounded-t-[40px] bg-[#F6F7F7] pb-10" onPress={() => {}}>
              <View className="h-[34px] items-center justify-center">
                <View className="h-[7px] w-[134px] rounded-[4px] bg-[#9B9797]" />
              </View>
              <View className="px-5 pb-4 pt-4">
                <Text className="mb-6 text-center text-[21.88px] font-ubuntu-semibold text-[#113E55]">
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
                        <Text className="text-sm font-inter-light text-[#113E55]">
                          {option.label}
                        </Text>
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
            </Pressable>
          </Pressable>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AddGuestMobile;
