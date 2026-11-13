import Back from '@/src/shared/components/navigation/Back';
import Button, { BUTTON_MARGIN_BOTTOM } from '@/src/shared/components/Button';
import { BACK_TO_TITLE_GAP_CLASS } from '@/src/shared/components/layout/ScreenHeader';
import { sharedStyles } from '@/src/shared/theme/styles';
import { cn } from '@/src/shared/utils/cn';
import { Stack, useNavigation, useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  Pressable,
  View,
  Modal,
  type TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FormData, FormErrors, GenderType } from '@/src/shared/types/general';
import { registerUser } from '@/src/features/users/services/user';
import { userFacingError } from '@/src/shared/services/api/errors';
import { useUserStore } from '@/src/store/userStore';
import { Toast, ToastType } from '@/src/shared/components/feedback/Toast';
import { RegisterUserPayload } from '@/src/features/users/types/user';
import OptionSheet, { type OptionSheetItem } from '@/src/features/admin/components/OptionSheet';
import SelectorField from '@/src/features/admin/components/SelectorField';
import { useAndroidBottomInset } from '@/src/shared/hooks/useAndroidBottomInset';
import { Feather } from '@expo/vector-icons';
import { getEstateById } from '@/src/features/admin/services/estate';
import { usePendingSeatReduction } from '@/src/features/admin/hooks/usePendingSeatReduction';
import {
  SEAT_REDUCTION_BLOCKED_MESSAGE,
  SEAT_REDUCTION_BLOCKED_TITLE,
} from '@/src/features/admin/utils/seatReduction';
import HouseholdSelectorSheet from '@/src/features/admin/components/HouseholdSelectorSheet';
import type { Household } from '@/src/features/admin/types/household';
import {
  buildRegisterUserPayload,
  REGISTRATION_GENDER_OPTIONS,
  REGISTRATION_ROLE_OPTIONS,
  validateRegistrationAddress,
  validateRegistrationPersonalField,
  validateRegistrationPersonalDetails,
} from '@/src/features/auth/utils/registrationValidation';

const GENDER_SHEET_ITEMS: OptionSheetItem[] = REGISTRATION_GENDER_OPTIONS.map((option) => ({
  label: option.label,
  value: option.value,
}));

const ROLE_SHEET_ITEMS: OptionSheetItem[] = REGISTRATION_ROLE_OPTIONS.map((option) => ({
  label: option.label,
  value: option.value,
}));

/** Figma 5056:3714 — empty #EFF1F1, filled #F6F7F7+#CEE5ED, error 5056:3716. */
function RegisterTextField({
  label,
  error,
  style,
  value,
  ...props
}: TextInputProps & { label: string; error?: string }) {
  const filled = String(value ?? '').length > 0;

  return (
    <View className="mb-4">
      <Text
        style={[
          sharedStyles.registrationLabel,
          error
            ? sharedStyles.registrationLabelError
            : filled
              ? sharedStyles.registrationLabelFilled
              : null,
        ]}
      >
        {label}
      </Text>
      <TextInput
        value={value}
        placeholderTextColor={error ? '#C40707' : '#878686'}
        style={[
          sharedStyles.registrationInput,
          filled && !error ? sharedStyles.registrationInputFilled : null,
          error ? sharedStyles.registrationInputError : null,
          style,
        ]}
        {...props}
      />
      {!!error && (
        <Text className="mt-1.5 font-inter-regular text-[11px]" style={{ color: '#E30404' }}>
          {error}
        </Text>
      )}
    </View>
  );
}

const RegisterUser = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const { systemBottom } = useAndroidBottomInset();
  const estateId = useUserStore((state) => state.estate_id) || '';
  const [currentStep, setCurrentStep] = useState(1);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    });
    return () => cancelAnimationFrame(frame);
  }, [currentStep]);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    gender: null,
    userType: null,
    homeAddress: '',
    householdId: null,
    householdName: '',
    apartmentNumber: '',
    apartmentName: '',
    city: '',
    state: '',
    postalCode: '',
    identificationUri: null,
    identificationName: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');
  const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(null);
  const [householdSelectorVisible, setHouseholdSelectorVisible] = useState(false);
  const [openSheet, setOpenSheet] = useState<'gender' | 'userType' | null>(null);

  const hasPendingSeatReduction = usePendingSeatReduction();
  const [seatReductionOverlayVisible, setSeatReductionOverlayVisible] = useState(false);

  useEffect(() => {
    if (hasPendingSeatReduction) {
      setSeatReductionOverlayVisible(true);
    }
  }, [hasPendingSeatReduction]);

  const handleDismissSeatReduction = () => {
    setSeatReductionOverlayVisible(false);
    if (router.canDismiss()) {
      router.dismiss(1);
    } else {
      router.replace('/admin');
    }
  };

  useEffect(() => {
    if (!estateId) return;

    let active = true;
    void getEstateById(estateId)
      .then((estate) => {
        if (!active) return;
        setFormData((current) => ({
          ...current,
          city: estate.city || estate.lga || '',
          state: estate.state || '',
          postalCode: estate.postal_code || '',
        }));
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [estateId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener(
      'beforeRemove' as never,
      (e: { preventDefault: () => void; data?: { action?: object } }) => {
        e.preventDefault();

        if (currentStep > 1) {
          setCurrentStep((step) => step - 1);
          setErrors({});
        } else if (e.data?.action) {
          navigation.dispatch(e.data.action as never);
        }
      }
    );

    return unsubscribe;
  }, [navigation, currentStep]);

  const validateStep1 = (): boolean => {
    const newErrors = validateRegistrationPersonalDetails(formData);

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors = validateRegistrationAddress(formData);

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (hasPendingSeatReduction) {
      setSeatReductionOverlayVisible(true);
      return;
    }
    if (currentStep === 1) {
      if (validateStep1()) {
        Keyboard.dismiss();
        setCurrentStep(2);
        setErrors({});
      }
    } else if (currentStep === 2) {
      if (validateStep2()) {
        setErrors({});
        void handleSaveUser();
      }
    }
  };

  const handleSaveUser = async () => {
    if (hasPendingSeatReduction) {
      setSeatReductionOverlayVisible(true);
      return;
    }
    setLoading(true);

    const { estate_id } = useUserStore.getState();

    try {
      const payload: RegisterUserPayload = buildRegisterUserPayload({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        role: formData.userType,
        gender: formData.gender,
        estateId: estate_id || '',
        householdId: formData.householdId,
        address: formData,
      });

      const regiteredUser = await registerUser(payload);

      if (regiteredUser && regiteredUser.id) {
        setToastMessage('User registered successfully!');
        setToastType('success');
        setToastVisible(true);
        // Leave immediately for Admin Tools — don't reset the form first (that looked like an
        // old empty Register screen when navigation lagged).
        setTimeout(() => {
          if (router.canDismiss()) {
            router.dismiss(1);
          } else {
            router.replace('/admin');
          }
        }, 800);
      } else {
        setToastMessage('Failed to register user. Please try again.');
        setToastType('error');
        setToastVisible(true);
      }
    } catch (error) {
      setToastMessage(userFacingError(error, 'An error occurred while registering user'));
      setToastType('error');
      setToastVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));

    if (
      typeof value === 'string' &&
      (key === 'firstName' || key === 'lastName' || key === 'email' || key === 'phoneNumber')
    ) {
      const fieldError = validateRegistrationPersonalField(key, value);
      setErrors((prev) => ({ ...prev, [key]: fieldError }));
    } else if (errors[key as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  return (
    <SafeAreaView
      style={[
        sharedStyles.container,
        sharedStyles.modalContainer,
        {
          backgroundColor: '#F6F7F7',
          flex: 1,
          paddingBottom: 50,
        },
      ]}
    >
      <Stack.Screen
        options={{
          headerShown: false,
          headerShadowVisible: false,
        }}
      />

      <Back
        type="short-arrow"
        showText={false}
        showBorder
        onPress={() => {
          if (router.canDismiss()) {
            router.dismiss(1);
          } else {
            router.replace('/admin');
          }
        }}
      />

      <Text
        numberOfLines={1}
        className={cn('ml-[2px] font-ubuntu-medium text-primary', BACK_TO_TITLE_GAP_CLASS)}
        style={{ fontSize: 27.34, lineHeight: 33 }}
      >
        Register User
      </Text>
      {currentStep <= 2 && (
        <Text
          numberOfLines={1}
          className="ml-[2px] mt-[8px] font-inter-light text-[14px] leading-[17px] text-[#878686]"
        >
          Enter the personal details of this user
        </Text>
      )}

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
          ref={scrollViewRef}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: systemBottom + 40 }}
        >
          {currentStep === 1 ? (
            <>
              <View className="mt-[46px]">
                <RegisterTextField
                  label="First Name"
                  placeholder="Enter first name"
                  value={formData.firstName}
                  onChangeText={(value) => updateFormData('firstName', value)}
                  error={errors.firstName}
                />
                <RegisterTextField
                  label="Last Name"
                  placeholder="Enter last name"
                  value={formData.lastName}
                  onChangeText={(value) => updateFormData('lastName', value)}
                  error={errors.lastName}
                />
                <RegisterTextField
                  label="Phone Number"
                  placeholder="Enter your phone number"
                  value={formData.phoneNumber}
                  onChangeText={(value) => updateFormData('phoneNumber', value)}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  textContentType="telephoneNumber"
                  error={errors.phoneNumber}
                />
                <RegisterTextField
                  label="Email Address"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChangeText={(value) => updateFormData('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                  error={errors.email}
                />
                <SelectorField
                  variant="registration"
                  label="Gender"
                  placeholder="Select gender"
                  value={
                    REGISTRATION_GENDER_OPTIONS.find((option) => option.value === formData.gender)
                      ?.label
                  }
                  onPress={() => setOpenSheet('gender')}
                  error={errors.gender}
                />
                <SelectorField
                  variant="registration"
                  label="Save User As"
                  placeholder="Select user type"
                  value={
                    REGISTRATION_ROLE_OPTIONS.find((option) => option.value === formData.userType)
                      ?.label
                  }
                  onPress={() => setOpenSheet('userType')}
                  error={errors.userType}
                />
                <View className="mt-8 items-center" style={{ marginBottom: BUTTON_MARGIN_BOTTOM }}>
                  <Button label="Continue" onPress={handleContinue} disabled={loading} />
                </View>
              </View>
            </>
          ) : (
            <>
              <View className="mt-11">
                <SelectorField
                  variant="registration"
                  label="Household"
                  placeholder="Select Household"
                  value={formData.householdName || null}
                  onPress={() => setHouseholdSelectorVisible(true)}
                  error={errors.householdId}
                />
                <RegisterTextField
                  label="Apartment Number"
                  placeholder="Enter apartment number or suite"
                  value={formData.apartmentNumber}
                  onChangeText={(value) => updateFormData('apartmentNumber', value)}
                  error={errors.apartmentNumber}
                />
                <RegisterTextField
                  label="Apartment Name"
                  placeholder="Enter apartment name"
                  value={formData.apartmentName}
                  onChangeText={(value) => updateFormData('apartmentName', value)}
                  error={errors.apartmentName}
                />
                <RegisterTextField
                  label="City"
                  placeholder="City unavailable"
                  value={formData.city}
                  editable={false}
                  selectTextOnFocus={false}
                  accessibilityLabel="Estate city"
                  accessibilityHint="This value comes from the estate address and cannot be changed"
                  error={errors.city}
                />
                <RegisterTextField
                  label="State"
                  placeholder="State unavailable"
                  value={formData.state}
                  editable={false}
                  selectTextOnFocus={false}
                  accessibilityLabel="Estate state"
                  accessibilityHint="This value comes from the estate address and cannot be changed"
                  error={errors.state}
                />
                <RegisterTextField
                  label="Postal Code"
                  placeholder="Postal code unavailable"
                  value={formData.postalCode}
                  editable={false}
                  selectTextOnFocus={false}
                  accessibilityLabel="Estate postal code"
                  accessibilityHint="This value comes from the estate address and cannot be changed"
                  error={errors.postalCode}
                />
                <View className="mt-3 items-center" style={{ marginBottom: BUTTON_MARGIN_BOTTOM }}>
                  <Button label="Save User" onPress={handleContinue} loading={loading} />
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {openSheet === 'gender' && (
        <OptionSheet
          visible
          title="Gender"
          items={GENDER_SHEET_ITEMS}
          selected={formData.gender ? [formData.gender] : []}
          onChange={(next) => {
            const value = (next[0] ?? null) as GenderType;
            setFormData((prev) => ({ ...prev, gender: value }));
            if (errors.gender) {
              setErrors((prev) => ({ ...prev, gender: undefined }));
            }
          }}
          onClose={() => setOpenSheet(null)}
        />
      )}

      {openSheet === 'userType' && (
        <OptionSheet
          visible
          title="Save User As"
          items={ROLE_SHEET_ITEMS}
          selected={formData.userType ? [formData.userType] : []}
          onChange={(next) => {
            updateFormData('userType', (next[0] ?? null) as 'resident' | 'security' | null);
          }}
          onClose={() => setOpenSheet(null)}
        />
      )}

      <HouseholdSelectorSheet
        visible={householdSelectorVisible}
        estateId={estateId}
        selected={selectedHousehold}
        onClose={() => setHouseholdSelectorVisible(false)}
        onSelect={(household) => {
          setSelectedHousehold(household);
          setFormData((current) => ({
            ...current,
            householdId: household.id,
            householdName: household.name,
          }));
          setErrors((current) => ({ ...current, householdId: undefined }));
        }}
      />

      {/* Seat Reduction Active Overlay */}
      <Modal
        visible={seatReductionOverlayVisible}
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={handleDismissSeatReduction}
      >
        <Pressable
          onPress={handleDismissSeatReduction}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 24,
          }}
        >
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 24,
              padding: 24,
              width: '100%',
              maxWidth: 340,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: '#FEE2E2',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Feather name="alert-triangle" size={26} color="#DC2626" />
            </View>

            <Text
              allowFontScaling={false}
              style={{
                fontFamily: 'UbuntuSans-Bold',
                fontSize: 18,
                color: '#113E55',
                textAlign: 'center',
                marginBottom: 12,
              }}
            >
              {SEAT_REDUCTION_BLOCKED_TITLE}
            </Text>

            <Text
              allowFontScaling={false}
              style={{
                fontFamily: 'Inter_18pt-Regular',
                fontSize: 14,
                lineHeight: 20,
                color: '#64748B',
                textAlign: 'center',
                marginBottom: 24,
              }}
            >
              {SEAT_REDUCTION_BLOCKED_MESSAGE}
            </Text>

            <View className="w-full items-center">
              <Button label="Done" onPress={handleDismissSeatReduction} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

export default RegisterUser;
