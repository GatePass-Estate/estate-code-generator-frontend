import Back from '@/src/components/mobile/Back';
import { sharedStyles } from '@/src/theme/styles';
import { Stack, useNavigation, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FormData, FormErrors, GenderType } from '@/src/types/general';
import { registerUser } from '@/src/lib/api/user';
import { useUserStore } from '@/src/lib/stores/userStore';
import { Toast, ToastType } from '@/src/components/mobile/Toast';
import { RegisterUserPayload } from '@/src/types/user';
import { Picker } from '@/src/components/mobile/Picker';
import { useAndroidBottomInset } from '@/src/hooks/useAndroidBottomInset';
import { Feather } from '@expo/vector-icons';
import { getEstateById } from '@/src/lib/api/estate';
import HouseholdSelectorSheet from '@/src/components/mobile/HouseholdSelectorSheet';
import type { Household } from '@/src/types/household';
import RegistrationIdPicker from '@/src/components/common/RegistrationIdPicker';
import type { RegistrationIdDocument } from '@/src/types/registration';
import {
  formatRegistrationAddress,
  REGISTRATION_GENDER_OPTIONS,
  REGISTRATION_ROLE_OPTIONS,
  validateRegistrationAddress,
  validateRegistrationIdentification,
  validateRegistrationPersonalDetails,
} from '@/src/lib/registrationValidation';

const RegisterUser = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const { systemBottom } = useAndroidBottomInset();
  const estateId = useUserStore((state) => state.estate_id) || '';
  const [currentStep, setCurrentStep] = useState(1);
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
  const [identificationDocument, setIdentificationDocument] =
    useState<RegistrationIdDocument | null>(null);

  useEffect(() => {
    if (!estateId) return;

    let active = true;
    void getEstateById(estateId)
      .then((estate) => {
        if (!active) return;
        setFormData((current) => ({
          ...current,
          city: estate.lga || estate.location || '',
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
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      e.preventDefault();

      if (currentStep > 1) {
        setCurrentStep((step) => step - 1);
        setErrors({});
      } else {
        navigation.dispatch(e.data.action);
      }
    });

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
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
        setErrors({});
      }
    } else if (currentStep === 2) {
      if (validateStep2()) {
        setCurrentStep(3);
        setErrors({});
      }
    } else {
      const identificationErrors = validateRegistrationIdentification(formData.identificationUri);
      setErrors(identificationErrors);
      if (Object.keys(identificationErrors).length === 0) {
        handleSaveUser();
      }
    }
  };

  const handleSaveUser = async () => {
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
        setIdentificationDocument(null);
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
    if (errors[key as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  return (
    <SafeAreaView
      style={[
        sharedStyles.container,
        sharedStyles.modalContainer,
        { backgroundColor: '#FFFFFF', paddingBottom: 50, flex: 1 },
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
      <Text
        numberOfLines={1}
        className={`ml-[2px] mt-2 h-[17px] text-[14px] leading-[14px] text-[#878686] font-inter-light ${
          currentStep <= 2 ? 'w-[245px]' : 'w-full'
        }`}
      >
        {currentStep <= 2
          ? 'Enter the personal details of this user'
          : 'Upload a government-issued ID for this user'}
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

              <View className="mb-[68px] min-h-[68px]">
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
                activeOpacity={0.8}
              >
                <Text className="text-[14px] leading-[14px] text-white font-ubuntu-medium">
                  Continue
                </Text>
              </TouchableOpacity>
            </>
          ) : currentStep === 2 ? (
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
                onPress={handleContinue}
                className="h-11 w-[278px] max-w-full self-center items-center justify-center rounded-[24px] border border-primary bg-primary"
                activeOpacity={0.8}
              >
                <Text className="text-[14px] leading-[14px] text-white font-ubuntu-medium">
                  Continue
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <RegistrationIdPicker
                value={identificationDocument}
                error={errors.identificationUri}
                onChange={(document) => {
                  setIdentificationDocument(document);
                  setFormData((current) => ({
                    ...current,
                    identificationUri: document?.uri ?? null,
                    identificationName: document?.name ?? '',
                  }));
                  setErrors((current) => ({ ...current, identificationUri: undefined }));
                }}
              />

              <TouchableOpacity
                disabled={loading}
                onPress={handleContinue}
                className={`mt-8 h-11 w-[278px] max-w-full self-center flex-row items-center justify-center gap-2 rounded-[24px] bg-primary ${loading ? 'opacity-70' : ''}`}
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
    </SafeAreaView>
  );
};

export default RegisterUser;
