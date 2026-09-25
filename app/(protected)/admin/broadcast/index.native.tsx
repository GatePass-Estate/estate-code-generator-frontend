import Back from '@/src/components/mobile/Back';
import { Toast, ToastType } from '@/src/components/mobile/Toast';
import OptionSheet, { type OptionSheetItem } from '@/src/components/mobile/OptionSheet';
import SelectorField from '@/src/components/mobile/SelectorField';
import { sharedStyles } from '@/src/theme/styles';
import { Stack, router, useNavigation } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BroadcastFormData,
  BroadcastFormErrors,
  DURATIONS,
  PRIORITY_LEVELS,
  USER_TYPES,
  type BroadcastAudienceChoice,
} from '@/src/types/broadcast';
import { createBroadcast, isBroadcastEntitlementError } from '@/src/lib/api/broadcast';
import { toCreateBroadcastPayload } from '@/src/lib/broadcastForm';
import { useUpgradePromptStore } from '@/src/hooks/usePlan';

type SheetName = 'userType' | 'priorityLevel' | 'duration' | null;

const INITIAL_FORM: BroadcastFormData = {
  userType: [],
  priorityLevel: 'medium',
  duration: '24_hours',
  subjectLine: '',
  bodyText: '',
};

/** Summarises the multi-select audience for the collapsed field. */
function audienceSummary(selected: BroadcastAudienceChoice[]): string | null {
  if (selected.length === 0) return null;

  const allOption = USER_TYPES.find((item) => item.selectsAll);
  if (allOption && selected.includes(allOption.value as BroadcastAudienceChoice)) {
    return allOption.label;
  }

  return USER_TYPES.filter((item) => selected.includes(item.value as BroadcastAudienceChoice))
    .map((item) => item.label)
    .join(', ');
}

function labelFor(items: { label: string; value: string }[], value: string): string | null {
  return items.find((item) => item.value === value)?.label ?? null;
}

const BroadcastMobile = () => {
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<BroadcastFormData>(INITIAL_FORM);

  const [errors, setErrors] = useState<BroadcastFormErrors>({});
  const [loading, setLoading] = useState(false);
  const [openSheet, setOpenSheet] = useState<SheetName>(null);
  const showUpgradePrompt = useUpgradePromptStore((s) => s.show);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');

  // Step 2's back gesture returns to step 1 rather than leaving the flow.
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (currentStep !== 2) return;
      e.preventDefault();
      setCurrentStep(1);
      setErrors({});
    });

    return unsubscribe;
  }, [navigation, currentStep]);

  const updateFormData = useCallback(
    <K extends keyof BroadcastFormData>(key: K, value: BroadcastFormData[K]) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    },
    []
  );

  const validateStep1 = (): boolean => {
    const newErrors: BroadcastFormErrors = {};

    if (formData.userType.length === 0) newErrors.userType = 'Select at least one type of user';
    if (!formData.priorityLevel) newErrors.priorityLevel = 'Priority level is required';
    if (!formData.duration) newErrors.duration = 'Duration is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: BroadcastFormErrors = {};

    if (!formData.subjectLine.trim()) newErrors.subjectLine = 'Subject line is required';
    if (!formData.bodyText.trim()) newErrors.bodyText = 'Body text is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendBroadcast = async () => {
    setLoading(true);

    try {
      await createBroadcast(toCreateBroadcastPayload(formData));

      setToastMessage('Broadcast sent successfully!');
      setToastType('success');
      setToastVisible(true);

      setFormData(INITIAL_FORM);
      setCurrentStep(1);
      setErrors({});

      setTimeout(() => router.back(), 1500);
    } catch (error: any) {
      const message =
        error instanceof Error ? error.message : 'An error occurred while sending broadcast';

      // The paid-plan gate is not a failure the admin can fix by retrying.
      if (isBroadcastEntitlementError(message)) {
        showUpgradePrompt('admin_broadcast');
        return;
      }

      setToastMessage(message);
      setToastType('error');
      setToastVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
        setErrors({});
      }
      return;
    }

    if (validateStep2()) {
      void handleSendBroadcast();
    }
  };

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

      <Text className="text-primary font-ubuntu-semibold mt-4 mb-7" style={{ fontSize: 22 }}>
        {currentStep === 1 ? 'Set Broadcast' : 'Send a broadcast'}
      </Text>

      <Toast
        message={toastMessage}
        type={toastType}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />

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
              <Text className="text-[#9B9797] font-inter-medium text-[9px] mb-1.5">
                Enter Subject Line
              </Text>
              <TextInput
                value={formData.subjectLine}
                onChangeText={(value) => updateFormData('subjectLine', value)}
                placeholder="Enter Subject Line"
                placeholderTextColor="#9B9797"
                className="bg-[#EFF1F1] rounded-[16px] h-12 px-5 font-inter-light text-sm text-[#113E55]"
              />
              {!!errors.subjectLine && (
                <Text className="text-danger font-inter-regular text-[11px] mt-1.5">
                  {errors.subjectLine}
                </Text>
              )}

              <Text className="text-[#9B9797] font-inter-medium text-[9px] mb-1.5 mt-5">
                Enter Body Text
              </Text>
              <TextInput
                value={formData.bodyText}
                onChangeText={(value) => updateFormData('bodyText', value)}
                placeholder="Enter body Text"
                placeholderTextColor="#9B9797"
                multiline
                textAlignVertical="top"
                className="bg-[#EFF1F1] rounded-[16px] px-5 py-4 font-inter-light text-sm text-[#113E55]"
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

        <Pressable
          onPress={handleContinue}
          disabled={loading}
          className="bg-primary rounded-[24px] h-11 items-center justify-center mb-6"
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          {loading ? (
            <ActivityIndicator color="#F6F7F7" />
          ) : (
            <Text className="text-[#F6F7F7] font-ubuntu-semibold text-sm">
              {currentStep === 1 ? 'Continue' : 'Send Broadcast'}
            </Text>
          )}
        </Pressable>
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
