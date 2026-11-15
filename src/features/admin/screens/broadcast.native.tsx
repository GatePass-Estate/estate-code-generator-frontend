import { useGoBack } from '@/src/shared/hooks/useGoBack';
import Back from '@/src/shared/components/navigation/Back';
import { Toast } from '@/src/shared/components/feedback/Toast';
import OptionSheet, { type OptionSheetItem } from '@/src/features/admin/components/OptionSheet';
import SelectorField from '@/src/features/admin/components/SelectorField';
import { sharedStyles } from '@/src/shared/theme/styles';
import { Stack, useNavigation } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import Button, { BUTTON_MARGIN_BOTTOM } from '@/src/shared/components/Button';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BroadcastFormData,
  DURATIONS,
  PRIORITY_LEVELS,
  USER_TYPES,
  type BroadcastAudienceChoice,
} from '@/src/features/notifications/types/broadcast';
import { PlanNoticeSlot } from '@/src/features/billing/components/FreePlanNotice';
import { useBroadcastMobileForm } from '@/src/features/admin/hooks/useBroadcastForm';
import { audienceSummary, labelFor } from '@/src/features/admin/utils/broadcastForm';

type SheetName = 'userType' | 'priorityLevel' | 'duration' | null;

const BroadcastMobile = () => {
  const goBack = useGoBack();
  const navigation = useNavigation();
  const [openSheet, setOpenSheet] = useState<SheetName>(null);
  const {
    currentStep,
    formData,
    errors,
    loading,
    updateFormData,
    backToSettings,
    handleContinue,
    noticeProps,
    toast,
    hideToast,
  } = useBroadcastMobileForm({ onSent: goBack });

  // Step 2's back gesture returns to step 1 rather than leaving the flow.
  useEffect(() => {
    const unsubscribe = navigation.addListener(
      'beforeRemove' as never,
      (e: { preventDefault: () => void }) => {
        if (currentStep !== 2) return;
        e.preventDefault();
        backToSettings();
      }
    );

    return unsubscribe;
  }, [navigation, currentStep, backToSettings]);

  const sheetConfig = useMemo(() => {
    if (openSheet === 'userType') {
      return {
        title: 'Type of User',
        items: USER_TYPES as OptionSheetItem[],
        selected: formData.userType as string[],
        multiple: true,
        onChange: (next: string[]) => updateFormData('userType', next as BroadcastAudienceChoice[]),
      };
    }
    if (openSheet === 'priorityLevel') {
      return {
        title: 'Set Priority Level',
        items: PRIORITY_LEVELS as OptionSheetItem[],
        selected: [formData.priorityLevel],
        multiple: false,
        onChange: (next: string[]) =>
          updateFormData('priorityLevel', next[0] as BroadcastFormData['priorityLevel']),
      };
    }
    if (openSheet === 'duration') {
      return {
        title: 'Set Duration',
        items: DURATIONS as OptionSheetItem[],
        selected: [formData.duration],
        multiple: false,
        onChange: (next: string[]) =>
          updateFormData('duration', next[0] as BroadcastFormData['duration']),
      };
    }
    return null;
  }, [openSheet, formData, updateFormData]);

  return (
    <SafeAreaView
      style={[sharedStyles.container, sharedStyles.modalContainer, { backgroundColor: '#F6F7F7' }]}
    >
      <Stack.Screen options={{ headerShown: false, headerShadowVisible: false }} />

      <Back type="short-arrow" showText={false} showBorder />

      <Text className="mb-7 mt-3 font-ubuntu-semibold text-primary" style={{ fontSize: 22 }}>
        {currentStep === 1 ? 'Set Broadcast' : 'Send a broadcast'}
      </Text>

      <Toast message={toast.message} type={toast.type} visible={toast.visible} onHide={hideToast} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {currentStep === 1 ? (
            <>
              <SelectorField
                label="Type of User"
                placeholder="Type of user"
                value={audienceSummary(formData.userType)}
                onPress={() => setOpenSheet('userType')}
                error={errors.userType}
              />

              <SelectorField
                label="Set Priority Level"
                placeholder="Set Broadcast Priority Level"
                value={labelFor(PRIORITY_LEVELS, formData.priorityLevel)}
                onPress={() => setOpenSheet('priorityLevel')}
                error={errors.priorityLevel}
              />

              <SelectorField
                label="Set Duration"
                placeholder="Select broadcast duration"
                value={labelFor(DURATIONS, formData.duration)}
                onPress={() => setOpenSheet('duration')}
                error={errors.duration}
              />
            </>
          ) : (
            <>
              <Text className="text-grey font-inter-medium text-[9px] mb-1.5">
                Enter Subject Line
              </Text>
              <TextInput
                value={formData.subjectLine}
                onChangeText={(value) => updateFormData('subjectLine', value)}
                placeholder="Enter Subject Line"
                placeholderTextColor="#9B9797"
                className="bg-[#EFF1F1] rounded-[16px] h-12 px-5 font-inter-light text-sm text-primary"
              />
              {!!errors.subjectLine && (
                <Text className="text-danger font-inter-regular text-[11px] mt-1.5">
                  {errors.subjectLine}
                </Text>
              )}

              <Text className="text-grey font-inter-medium text-[9px] mb-1.5 mt-5">
                Enter Body Text
              </Text>
              <TextInput
                value={formData.bodyText}
                onChangeText={(value) => updateFormData('bodyText', value)}
                placeholder="Enter body Text"
                placeholderTextColor="#9B9797"
                multiline
                textAlignVertical="top"
                className="bg-[#EFF1F1] rounded-[16px] px-5 py-4 font-inter-light text-sm text-primary"
                style={{ minHeight: 260 }}
              />
              {!!errors.bodyText && (
                <Text className="text-danger font-inter-regular text-[11px] mt-1.5">
                  {errors.bodyText}
                </Text>
              )}
            </>
          )}
        </ScrollView>

        <PlanNoticeSlot {...noticeProps}>
          <View className="items-center" style={{ marginBottom: BUTTON_MARGIN_BOTTOM }}>
            <Button
              label={currentStep === 1 ? 'Continue' : 'Send Broadcast'}
              onPress={handleContinue}
              loading={loading}
            />
          </View>
        </PlanNoticeSlot>
      </KeyboardAvoidingView>

      {sheetConfig && (
        <OptionSheet
          visible
          title={sheetConfig.title}
          items={sheetConfig.items}
          selected={sheetConfig.selected}
          multiple={sheetConfig.multiple}
          onChange={sheetConfig.onChange}
          onClose={() => setOpenSheet(null)}
        />
      )}
    </SafeAreaView>
  );
};

export default BroadcastMobile;
