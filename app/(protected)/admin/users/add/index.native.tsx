import Back from '@/src/components/mobile/Back';
import { sharedStyles } from '@/src/theme/styles';
import { Stack, useNavigation, useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  useWindowDimensions,
  View,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FormData, FormErrors, GenderType } from '@/src/types/general';
import { registerUser } from '@/src/lib/api/user';
import { useUserStore } from '@/src/lib/stores/userStore';
import { Toast, ToastType } from '@/src/components/mobile/Toast';
import { RegisterUserPayload } from '@/src/types/user';
import { Picker } from '@/src/components/mobile/Picker';
import { useAndroidBottomInset } from '@/src/hooks/useAndroidBottomInset';
import { Feather } from '@expo/vector-icons';
import { getEstateById } from '@/src/lib/api/estate';
import { useEstateEntitlements } from '@/src/lib/api/entitlements';
import { useEstateSubscription } from '@/src/hooks/useBillingQueries';
import HouseholdSelectorSheet from '@/src/components/mobile/HouseholdSelectorSheet';
import type { Household } from '@/src/types/household';
import {
  formatRegistrationAddress,
  REGISTRATION_GENDER_OPTIONS,
  REGISTRATION_ROLE_OPTIONS,
  validateRegistrationAddress,
  validateRegistrationPersonalField,
  validateRegistrationPersonalDetails,
} from '@/src/lib/registrationValidation';

const RegisterUser = () => {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
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

  const { data: estateEntitlements } = useEstateEntitlements();
  const { data: subscriptionData } = useEstateSubscription();
  const subscription = subscriptionData?.subscription;
  const estateUserCapacity =
    estateEntitlements?.coveredUsers ?? subscription?.covered_users ?? null;
  const pendingCoveredUsers = subscription?.pending_covered_users ?? null;
  const hasPendingSeatReduction = Boolean(
    (pendingCoveredUsers !== null &&
      estateUserCapacity !== null &&
      pendingCoveredUsers < estateUserCapacity) ||
    (estateEntitlements as any)?.pending_seat_reduction ||
    (estateEntitlements as any)?.has_pending_seat_reduction ||
    (estateEntitlements as any)?.seat_reduction_pending ||
    (estateEntitlements as any)?.seat_reduction_requested ||
    estateEntitlements?.reason?.toLowerCase().includes('seat') ||
    estateEntitlements?.reason?.toLowerCase().includes('reduction') ||
    (estateEntitlements as any)?.subscription_status === 'pending_seat_reduction'
  );
  const [seatReductionOverlayVisible, setSeatReductionOverlayVisible] = useState(false);

  useEffect(() => {
    if (hasPendingSeatReduction) {
      setSeatReductionOverlayVisible(true);
    }
  }, [hasPendingSeatReduction]);

  const handleDismissSeatReduction = () => {
    setSeatReductionOverlayVisible(false);
    router.back();
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
      const payload: RegisterUserPayload = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone_number: formData.phoneNumber,
        role: formData.userType,
        gender: formData.gender,
        estate_id: estate_id || '',
        home_address: formatRegistrationAddress(formData),
        household_id: formData.householdId,
      };

      const regiteredUser = await registerUser(payload);

      if (regiteredUser && regiteredUser.id) {
        setToastMessage('User registered successfully!');
        setToastType('success');
        setToastVisible(true);
        setFormData({
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
        setSelectedHousehold(null);
        setCurrentStep(1);
        setErrors({});
        setTimeout(() => {
          router.replace('/admin');
        }, 2000);
      } else {
        setToastMessage('Failed to register user. Please try again.');
        setToastType('error');
        setToastVisible(true);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred while registering user';
      setToastMessage(errorMessage);
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
        {
          backgroundColor: '#FFFFFF',
          paddingBottom: 50,
          paddingTop: Math.max(0, 88 - insets.top),
          flex: 1,
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
        borderSize={30}
        leftOffset={-3}
        iconStyle={{
          height: 12,
          top: 0,
          width: 8.56,
        }}
      />

      <Text
        numberOfLines={1}
        className="ml-[2px] mt-11 h-[33px] text-[27.34px] leading-[27.34px] font-ubuntu-medium text-[#113E55]"
      >
        Register User
      </Text>
      {currentStep <= 2 && (
        <Text
          numberOfLines={1}
          className="ml-[2px] mt-2 h-[17px] w-[245px] text-[14px] leading-[14px] text-[#878686] font-inter-light"
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
              <View className="mt-[43px] mb-4 min-h-[72px]">
                <Text
                  style={[
                    sharedStyles.registrationLabel,
                    errors.firstName ? { color: '#ED0808' } : null,
                  ]}
                >
                  First Name
                </Text>
                <TextInput
                  placeholder="Enter first name"
                  placeholderTextColor={errors.firstName ? '#ED0808' : '#878686'}
                  value={formData.firstName}
                  onChangeText={(value) => updateFormData('firstName', value)}
                  style={[
                    sharedStyles.registrationInput,
                    errors.firstName && sharedStyles.registrationInputError,
                  ]}
                />
                {errors.firstName && (
                  <Text className="mt-1 text-xs text-red-600 font-inter-regular">
                    {errors.firstName}
                  </Text>
                )}
              </View>

              <View className="mb-4 min-h-[72px]">
                <Text
                  style={[
                    sharedStyles.registrationLabel,
                    errors.lastName ? { color: '#ED0808' } : null,
                  ]}
                >
                  Last Name
                </Text>
                <TextInput
                  placeholder="Enter last name"
                  placeholderTextColor={errors.lastName ? '#ED0808' : '#878686'}
                  value={formData.lastName}
                  onChangeText={(value) => updateFormData('lastName', value)}
                  style={[
                    sharedStyles.registrationInput,
                    errors.lastName && sharedStyles.registrationInputError,
                  ]}
                />
                {errors.lastName && (
                  <Text className="text-danger text-xs font-inter-regular mt-1">
                    {errors.lastName}
                  </Text>
                )}
              </View>

              <View className="mb-4">
                <Text
                  style={[
                    sharedStyles.registrationLabel,
                    errors.phoneNumber ? { color: '#ED0808' } : null,
                  ]}
                >
                  Phone Number
                </Text>
                <TextInput
                  placeholder="Enter your phone number"
                  placeholderTextColor={errors.phoneNumber ? '#ED0808' : '#878686'}
                  value={formData.phoneNumber}
                  onChangeText={(value) => updateFormData('phoneNumber', value)}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  textContentType="telephoneNumber"
                  style={[
                    sharedStyles.registrationInput,
                    errors.phoneNumber && sharedStyles.registrationInputError,
                  ]}
                />
                {errors.phoneNumber && (
                  <Text className="mt-1 text-xs text-red-600 font-inter-regular">
                    {errors.phoneNumber}
                  </Text>
                )}
              </View>

              <View className="mb-4">
                <Text
                  style={[
                    sharedStyles.registrationLabel,
                    errors.email ? { color: '#ED0808' } : null,
                  ]}
                >
                  Email Address
                </Text>
                <TextInput
                  placeholder="Enter your email address"
                  placeholderTextColor={errors.email ? '#ED0808' : '#878686'}
                  value={formData.email}
                  onChangeText={(value) => updateFormData('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                  style={[
                    sharedStyles.registrationInput,
                    errors.email && sharedStyles.registrationInputError,
                  ]}
                />
                {errors.email && (
                  <Text className="mt-1 text-xs text-red-600 font-inter-regular">
                    {errors.email}
                  </Text>
                )}
              </View>

              <View className="mb-4 min-h-[68px]">
                <Text
                  style={[
                    sharedStyles.registrationLabel,
                    errors.gender ? { color: '#ED0808' } : null,
                  ]}
                >
                  Gender
                </Text>
                <Picker
                  label=""
                  variant="registration"
                  invalid={Boolean(errors.gender)}
                  selectedValue={formData.gender}
                  onValueChange={(value) => {
                    setFormData((prev) => ({
                      ...prev,
                      gender: value as GenderType,
                    }));
                    if (errors.gender) {
                      setErrors((prev) => ({ ...prev, gender: undefined }));
                    }
                  }}
                  placeholder="Select gender"
                  items={REGISTRATION_GENDER_OPTIONS}
                />
                {errors.gender && (
                  <Text className="mt-1 text-xs text-red-600 font-inter-regular">
                    {errors.gender}
                  </Text>
                )}
              </View>

              <View className="min-h-[68px]" style={{ marginBottom: screenHeight < 900 ? 24 : 68 }}>
                <Text
                  style={[
                    sharedStyles.registrationLabel,
                    errors.userType ? { color: '#ED0808' } : null,
                  ]}
                >
                  Save User As
                </Text>
                <Picker
                  label=""
                  variant="registration"
                  invalid={Boolean(errors.userType)}
                  selectedValue={formData.userType}
                  onValueChange={(value) =>
                    updateFormData('userType', value as 'resident' | 'security')
                  }
                  placeholder="Select user type"
                  items={[...REGISTRATION_ROLE_OPTIONS]}
                />
                {errors.userType && (
                  <Text className="text-danger text-xs font-inter-regular mt-1">
                    {errors.userType}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                disabled={loading}
                onPress={handleContinue}
                className={`h-11 w-[278px] max-w-full self-center items-center justify-center rounded-[24px] border border-primary bg-primary ${loading ? 'opacity-70' : ''}`}
                style={{ transform: [{ translateX: -3.5 }] }}
                activeOpacity={0.8}
              >
                <Text className="text-[14px] leading-[14px] text-white font-ubuntu-medium">
                  Continue
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View className="mt-11 mb-4 min-h-[68px]">
                <Text
                  style={[
                    sharedStyles.registrationLabel,
                    errors.householdId ? { color: '#ED0808' } : null,
                  ]}
                >
                  Household
                </Text>
                <TouchableOpacity
                  onPress={() => setHouseholdSelectorVisible(true)}
                  className={`mt-2 flex-row items-center justify-between rounded-2xl border px-4 ${
                    errors.householdId
                      ? 'border-danger bg-[#FFF1F1]'
                      : 'border-[#CEE5ED] bg-[#F6F7F7]'
                  }`}
                  style={{ borderWidth: StyleSheet.hairlineWidth, height: 48 }}
                >
                  <Text
                    className={`text-[14px] font-inter-regular ${
                      errors.householdId
                        ? 'text-danger'
                        : formData.householdName
                          ? 'text-primary'
                          : 'text-[#878686]'
                    }`}
                  >
                    {formData.householdName || 'Select Household'}
                  </Text>
                  <Feather
                    name="chevron-down"
                    size={20}
                    color={errors.householdId ? '#ED0808' : '#878686'}
                  />
                </TouchableOpacity>
                {errors.householdId && (
                  <Text className="mt-1 text-xs text-danger font-inter-regular">
                    {errors.householdId}
                  </Text>
                )}
              </View>

              <View className="mb-4 min-h-[68px]">
                <Text
                  style={[
                    sharedStyles.registrationLabel,
                    errors.apartmentNumber ? { color: '#ED0808' } : null,
                  ]}
                >
                  Apartment Number
                </Text>
                <TextInput
                  placeholder="Enter apartment number or suite"
                  placeholderTextColor={errors.apartmentNumber ? '#ED0808' : '#878686'}
                  value={formData.apartmentNumber}
                  onChangeText={(value) => updateFormData('apartmentNumber', value)}
                  style={[
                    sharedStyles.registrationInput,
                    errors.apartmentNumber && sharedStyles.registrationInputError,
                  ]}
                />
                {errors.apartmentNumber && (
                  <Text className="mt-1 text-xs text-danger font-inter-regular">
                    {errors.apartmentNumber}
                  </Text>
                )}
              </View>

              <View className="mb-4 min-h-[68px]">
                <Text
                  style={[
                    sharedStyles.registrationLabel,
                    errors.apartmentName ? { color: '#ED0808' } : null,
                  ]}
                >
                  Apartment Name
                </Text>
                <TextInput
                  placeholder="Enter apartment name"
                  placeholderTextColor={errors.apartmentName ? '#ED0808' : '#878686'}
                  value={formData.apartmentName}
                  onChangeText={(value) => updateFormData('apartmentName', value)}
                  style={[
                    sharedStyles.registrationInput,
                    errors.apartmentName && sharedStyles.registrationInputError,
                  ]}
                />
                {errors.apartmentName && (
                  <Text className="mt-1 text-xs text-danger font-inter-regular">
                    {errors.apartmentName}
                  </Text>
                )}
              </View>

              <View className="mb-4 min-h-[68px]">
                <Text
                  style={[
                    sharedStyles.registrationLabel,
                    errors.city ? { color: '#ED0808' } : null,
                  ]}
                >
                  City
                </Text>
                <TextInput
                  placeholder="City unavailable"
                  placeholderTextColor={errors.city ? '#ED0808' : '#878686'}
                  value={formData.city}
                  editable={false}
                  selectTextOnFocus={false}
                  accessibilityLabel="Estate city"
                  accessibilityHint="This value comes from the estate address and cannot be changed"
                  style={[
                    sharedStyles.registrationInput,
                    errors.city && sharedStyles.registrationInputError,
                  ]}
                />
                {errors.city && (
                  <Text className="mt-1 text-xs text-danger font-inter-regular">{errors.city}</Text>
                )}
              </View>

              <View className="mb-4 min-h-[68px]">
                <Text
                  style={[
                    sharedStyles.registrationLabel,
                    errors.state ? { color: '#ED0808' } : null,
                  ]}
                >
                  State
                </Text>
                <View
                  accessible
                  accessibilityLabel={`Estate state: ${formData.state || 'unavailable'}`}
                  accessibilityHint="This value comes from the estate address and cannot be changed"
                  className={`mt-2 h-12 justify-center rounded-2xl border px-4 ${
                    errors.state ? 'border-danger bg-[#FFF1F1]' : 'border-[#CEE5ED] bg-[#F6F7F7]'
                  }`}
                  style={{ borderWidth: StyleSheet.hairlineWidth }}
                >
                  <Text
                    className={`text-[14px] font-inter-regular ${
                      errors.state
                        ? 'text-danger'
                        : formData.state
                          ? 'text-primary'
                          : 'text-[#878686]'
                    }`}
                  >
                    {formData.state || 'State unavailable'}
                  </Text>
                </View>
                {errors.state && (
                  <Text className="mt-1 text-xs text-danger font-inter-regular">
                    {errors.state}
                  </Text>
                )}
              </View>

              <View className="mb-[68px] min-h-[68px]">
                <Text
                  style={[
                    sharedStyles.registrationLabel,
                    errors.postalCode ? { color: '#ED0808' } : null,
                  ]}
                >
                  Postal Code
                </Text>
                <TextInput
                  placeholder="Postal code unavailable"
                  placeholderTextColor={errors.postalCode ? '#ED0808' : '#878686'}
                  value={formData.postalCode}
                  editable={false}
                  selectTextOnFocus={false}
                  accessibilityLabel="Estate postal code"
                  accessibilityHint="This value comes from the estate address and cannot be changed"
                  style={[
                    sharedStyles.registrationInput,
                    errors.postalCode && sharedStyles.registrationInputError,
                  ]}
                />
                {errors.postalCode && (
                  <Text className="mt-1 text-xs text-danger font-inter-regular">
                    {errors.postalCode}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                disabled={loading}
                onPress={handleContinue}
                className={`h-11 w-[278px] max-w-full self-center flex-row items-center justify-center gap-2 rounded-[24px] border border-primary bg-primary ${loading ? 'opacity-70' : ''}`}
                activeOpacity={0.8}
              >
                {loading && <ActivityIndicator color="#fff" size="small" />}
                <Text className="text-[14px] leading-[14px] text-white font-ubuntu-medium">
                  {loading ? 'Saving User...' : 'Save User'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

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
              Registration Blocked
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
              A seat reduction request prevents addition of new users. To add users, the request has
              to be cancelled.
            </Text>

            <TouchableOpacity
              onPress={handleDismissSeatReduction}
              activeOpacity={0.8}
              style={{
                width: '100%',
                backgroundColor: '#113E55',
                borderRadius: 28,
                paddingVertical: 14,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: 'Inter_18pt-Medium',
                  fontSize: 15,
                  color: '#FFFFFF',
                }}
              >
                Done
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

export default RegisterUser;
