import { useState } from 'react';
import { View, Text, Pressable, Alert, ScrollView } from 'react-native';
import AppTextInput from '@/src/shared/components/form/AppTextInput';
import BottomSheet from '@/src/shared/components/feedback/BottomSheet';
import { Stack } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAddGuest } from '@/src/features/visitors/hooks/useAddGuest';
import { GENDER_OPTIONS, RELATIONSHIP_OPTIONS } from '@/src/features/visitors/utils/addGuestForm';
import { sharedStyles } from '@/src/shared/theme/styles';
import { useAndroidBottomInset } from '@/src/shared/hooks/useAndroidBottomInset';
import { CheckRingIcon, ExpandMoreIcon } from '@/src/assets/svgs';
import Button, { BUTTON_MARGIN_BOTTOM } from '@/src/shared/components/Button';
import { PlanNoticeSlot } from '@/src/features/billing/components/FreePlanNotice';
import ScreenHeader from '@/src/shared/components/layout/ScreenHeader';
import HeaderActions from '@/src/features/dashboard/components/HeaderActions';
import { useFeatureGate } from '@/src/features/billing/hooks/usePlan';

function showError(message: string) {
  Alert.alert('Error', message);
}

const AddGuestMobile = () => {
  const { tabContentPadding } = useAndroidBottomInset();
  const [genderSheetVisible, setGenderSheetVisible] = useState(false);
  const [relationshipSheetVisible, setRelationshipSheetVisible] = useState(false);
  const saveGuestGate = useFeatureGate('guest_management');
  const {
    name: guestName,
    setName: setGuestName,
    gender,
    setGender,
    genderLabel,
    relationship,
    setRelationship,
    relationshipLabel,
    saveToList: addToGuestList,
    setSaveToList: setAddToGuestList,
    saving: savingGuest,
    saveGuest,
    continueToDuration,
  } = useAddGuest({ platform: 'native', onError: showError });

  function handleContinue() {
    continueToDuration(addToGuestList && saveGuestGate.allowed);
  }

  function handleSaveGuest() {
    void saveGuest(saveGuestGate.requestAccess);
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
          subtitleClassName="text-[#878686]"
          containerClassName="mb-[19px]"
        />

        <View style={{ gap: 19 }}>
          <View className="gap-2">
            <Text className="text-2xs font-inter-medium text-[#878686]">Name</Text>
            <AppTextInput
              className="h-14 rounded-[16px] bg-[#EFF1F1] px-4"
              placeholder="Enter Guest Name..."
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
