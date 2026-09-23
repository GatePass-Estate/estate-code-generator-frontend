import WebSidebar from '@/src/components/web/WebSidebar';
import { router, usePathname } from 'expo-router';
import { useEffect, useState, ChangeEvent } from 'react';
import { Image, Platform, ActivityIndicator, useWindowDimensions } from 'react-native';
import WebNavLink from '@/src/components/web/WebNavLink';
import { menuRoutes } from '@/app/(protected)/user/_layout';
import { adminRoutes } from '../../_layout';
import icons from '@/src/constants/icons';
import Modal from '@/src/components/web/Modal';
import { registerUser } from '@/src/lib/api/user';
import { useUserStore } from '@/src/lib/stores/userStore';
import { FormErrors, GenderType } from '@/src/types/general';
import { RegisterUserPayload } from '@/src/types/user';
import { getWidthBreakpoint } from '@/src/lib/helpers';
import RegisterUser from './index.native';
import HouseholdSelectorSheet from '@/src/components/mobile/HouseholdSelectorSheet';
import type { Household } from '@/src/types/household';
import RegistrationIdPicker from '@/src/components/common/RegistrationIdPicker';
import type { RegistrationIdDocument } from '@/src/types/registration';
import { getEstateById } from '@/src/lib/api/estate';
import {
  formatRegistrationAddress,
  REGISTRATION_GENDER_OPTIONS,
  REGISTRATION_ROLE_OPTIONS,
  validateRegistrationAddress,
  validateRegistrationIdentification,
  validateRegistrationPersonalDetails,
} from '@/src/lib/registrationValidation';

function RegisterUserWeb() {
  const estateId = useUserStore((store) => store.estate_id) || '';
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('error');
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [running, setRunning] = useState(false);
  const [processingAction, setProcessingAction] = useState<'continue' | 'save' | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<GenderType>(null);
  const [selectedRole, setSelectedRole] = useState<'resident' | 'security'>('resident');

  const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(null);
  const [householdSelectorVisible, setHouseholdSelectorVisible] = useState(false);
  const [apartmentNumber, setApartmentNumber] = useState('');
  const [apartmentName, setApartmentName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [identificationDocument, setIdentificationDocument] =
    useState<RegistrationIdDocument | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') document.title = 'Add User - Admin Access - GatePass';
  }, []);

  useEffect(() => {
    if (!estateId) return;

    let active = true;
    void getEstateById(estateId)
      .then((estate) => {
        if (!active) return;
        setCity((current) => current || estate.lga || estate.location || '');
        setState((current) => current || estate.state || '');
        setPostalCode((current) => current || estate.postal_code || '');
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [estateId]);

  const pathname = usePathname();

  function onNavigate(route: string): void {
    router.push(route as any);
  }

  const validateStep1 = (): boolean => {
    const errors = validateRegistrationPersonalDetails({
      firstName,
      lastName,
      email,
      phoneNumber: phone,
      gender,
      userType: selectedRole,
    });
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const clearFieldError = (field: keyof FormErrors) => {
    if (fieldErrors[field]) {
      setFieldErrors((current) => ({ ...current, [field]: undefined }));
    }
  };

  const validateStep2 = (): boolean => {
    const errors = validateRegistrationAddress({
      householdId: selectedHousehold?.id ?? null,
      apartmentNumber,
      apartmentName,
      city,
      state,
      postalCode,
    });
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
      setFieldErrors({});
    } else if (step === 2 && validateStep2()) {
      setStep(3);
      setFieldErrors({});
    }
  };

  const handleSaveUser = async () => {
    const identificationErrors = validateRegistrationIdentification(
      identificationDocument?.uri ?? null
    );
    setFieldErrors(identificationErrors);

    if (Object.keys(identificationErrors).length === 0) {
      setRunning(true);
      setProcessingAction('save');
      try {
        const { estate_id } = useUserStore.getState();

        const payload: RegisterUserPayload = {
          first_name: firstName,
          last_name: lastName,
          email,
          phone_number: phone,
          role: selectedRole,
          gender,
          estate_id: estate_id || '',
          home_address: formatRegistrationAddress({
            householdId: selectedHousehold?.id ?? null,
            apartmentNumber,
            apartmentName,
            city,
            state,
            postalCode,
          }),
          household_id: selectedHousehold?.id ?? null,
        };

        const registeredUser = await registerUser(payload);

        if (registeredUser && registeredUser.id) {
          setMessageType('success');
          setError('User registered successfully!');
          setFirstName('');
          setLastName('');
          setEmail('');
          setPhone('');
          setGender(null);
          setSelectedRole('resident');
          setSelectedHousehold(null);
          setApartmentNumber('');
          setApartmentName('');
          setCity('');
          setState('');
          setPostalCode('');
          setIdentificationDocument(null);
          setStep(1);

          setTimeout(() => {
            router.push('/admin');
          }, 2000);
        } else {
          setMessageType('error');
          setError('Failed to register user. Please try again.');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'An error occurred while registering user';
        setMessageType('error');
        setError(errorMessage);
      } finally {
        setRunning(false);
        setProcessingAction(null);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.push('/admin');
    }
  };

  return (
    <div className="flex h-full w-screen overflow-y-scroll bg-body">
      <WebSidebar
        routes={menuRoutes
          .filter((el) => el.for === 'web' || el.for === 'both')
          .map((data) => data)}
        onNavigate={onNavigate}
      />

      <div className="web-body pb-20">
        <div className="mt-20 mb-10">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-5xl font-ubuntu-regular text-grey">Admin Access</h1>
          </div>

          <div className="grid grid-cols-4 gap-9 md:grid-cols-12 mb-10">
            <div className="flex flex-col gap-5 w-full col-span-2">
              {adminRoutes.map(({ name, title, link, icon }, index) => {
                const isActive = pathname === link;

                return (
                  <div
                    key={name + index}
                    onClick={() => onNavigate(link)}
                    className={`flex gap-3 items-center cursor-pointer p-3 rounded-lg transition-all ${isActive ? 'bg-accent text-primary font-medium' : 'hover:bg-accent hover:text-primary hover:font-medium'}`}
                  >
                    <Image source={icon} style={{ width: 24, height: 24 }} resizeMode="contain" />
                    <WebNavLink color="primary">{title}</WebNavLink>
                  </div>
                );
              })}
            </div>

            <div className="col-span-10">
              <div className="mt-6">
                <h2 className="text-2xl font-ubuntu-medium text-primary">Register User</h2>
                <p className="text-base text-tertiary mt-1">
                  {step === 1
                    ? 'Add new users, either resident or security personnel'
                    : step === 2
                      ? 'Select a household and confirm the user’s address'
                      : 'Upload a government-issued ID for this user'}
                </p>
              </div>

              <div className="rounded-lg py-5 bg-white flex flex-col gap-6">
                {step === 1 ? (
                  <>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="input-group-web">
                        <label htmlFor="firstName" className="input-label-web">
                          Name
                        </label>
                        <input
                          name="firstName"
                          placeholder="Enter user name"
                          value={firstName}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            setFirstName(e.target.value);
                            clearFieldError('firstName');
                          }}
                          className={`input-style-web border ${fieldErrors.firstName ? 'registration-input-error-web' : 'border-transparent'}`}
                        />
                        {fieldErrors.firstName && (
                          <p className="registration-error-web">{fieldErrors.firstName}</p>
                        )}
                      </div>

                      <div className="input-group-web">
                        <label htmlFor="lastName" className="input-label-web">
                          Last Name
                        </label>
                        <input
                          name="lastName"
                          placeholder="Enter last name"
                          value={lastName}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            setLastName(e.target.value);
                            clearFieldError('lastName');
                          }}
                          className={`input-style-web border ${fieldErrors.lastName ? 'registration-input-error-web' : 'border-transparent'}`}
                        />
                        {fieldErrors.lastName && (
                          <p className="registration-error-web">{fieldErrors.lastName}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="input-group-web">
                        <label htmlFor="email" className="input-label-web">
                          Email Address
                        </label>
                        <input
                          name="email"
                          type="email"
                          placeholder="Enter user email address"
                          value={email}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            setEmail(e.target.value);
                            clearFieldError('email');
                          }}
                          className={`input-style-web border ${fieldErrors.email ? 'registration-input-error-web' : 'border-transparent'}`}
                        />
                        {fieldErrors.email && (
                          <p className="registration-error-web">{fieldErrors.email}</p>
                        )}
                      </div>

                      <div className="input-group-web">
                        <label htmlFor="phone" className="input-label-web">
                          Phone number
                        </label>
                        <input
                          name="phone"
                          placeholder="Enter phone number"
                          value={phone}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            setPhone(e.target.value);
                            clearFieldError('phoneNumber');
                          }}
                          className={`input-style-web border ${fieldErrors.phoneNumber ? 'registration-input-error-web' : 'border-transparent'}`}
                        />
                        {fieldErrors.phoneNumber && (
                          <p className="registration-error-web">{fieldErrors.phoneNumber}</p>
                        )}
                      </div>
                    </div>

                    <div className="input-group-web">
                      <label htmlFor="gender" className="input-label-web">
                        Gender
                      </label>
                      <div className="flex flex-row flex-wrap gap-2 text-sm mt-1">
                        {REGISTRATION_GENDER_OPTIONS.map((g, index) => {
                          const active = gender === g.value;
                          return (
                            <div
                              key={g.value + index}
                              className={`flex flex-row items-center px-4 py-2 rounded-md bg-light-grey ${active && 'bg-[#e6f4ef] border border-[#cfe7db]'} gap-3 cursor-pointer`}
                              onClick={() => {
                                setGender(g.value as GenderType);
                                clearFieldError('gender');
                              }}
                            >
                              <p className="text-primary">{g.label}</p>
                              {active && (
                                <Image
                                  source={icons.checkIcon}
                                  style={{ width: 20, height: 20 }}
                                  resizeMode="contain"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {fieldErrors.gender && (
                        <p className="registration-error-web">{fieldErrors.gender}</p>
                      )}
                    </div>

                    <div className="input-group-web !flex-row !items-center !gap-6">
                      <label htmlFor="role" className="input-label-web">
                        Save As
                      </label>
                      <div className="flex flex-row flex-wrap gap-2 text-sm mt-1">
                        {REGISTRATION_ROLE_OPTIONS.map((r, index) => {
                          const active = selectedRole === r.value;
                          return (
                            <div
                              key={r.value + index}
                              className={`flex flex-row items-center px-4 py-2 rounded-md bg-light-grey ${active && 'bg-[#e6f4ef] border border-[#cfe7db]'} gap-3 cursor-pointer`}
                              onClick={() => {
                                setSelectedRole(r.value);
                                clearFieldError('userType');
                              }}
                            >
                              <p className="text-primary">{r.label}</p>
                              {active && (
                                <Image
                                  source={icons.checkIcon}
                                  style={{ width: 20, height: 20 }}
                                  resizeMode="contain"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {fieldErrors.userType && (
                        <p className="registration-error-web">{fieldErrors.userType}</p>
                      )}
                    </div>
                  </>
                ) : step === 2 ? (
                  <>
                    <div className="input-group-web">
                      <label htmlFor="household" className="input-label-web">
                        Household
                      </label>
                      <button
                        id="household"
                        type="button"
                        onClick={() => setHouseholdSelectorVisible(true)}
                        className={`input-style-web border text-left ${
                          fieldErrors.householdId
                            ? 'registration-input-error-web'
                            : 'border-transparent'
                        } ${selectedHousehold ? 'text-primary' : 'text-grey'}`}
                      >
                        {selectedHousehold?.name || 'Select Household'}
                      </button>
                      {fieldErrors.householdId && (
                        <p className="registration-error-web">{fieldErrors.householdId}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="input-group-web">
                        <label htmlFor="apartmentNumber" className="input-label-web">
                          Apartment Number
                        </label>
                        <input
                          id="apartmentNumber"
                          placeholder="Enter apartment number or suite"
                          value={apartmentNumber}
                          onChange={(event) => {
                            setApartmentNumber(event.target.value);
                            clearFieldError('apartmentNumber');
                          }}
                          className={`input-style-web border ${fieldErrors.apartmentNumber ? 'registration-input-error-web' : 'border-transparent'}`}
                        />
                        {fieldErrors.apartmentNumber && (
                          <p className="registration-error-web">{fieldErrors.apartmentNumber}</p>
                        )}
                      </div>

                      <div className="input-group-web">
                        <label htmlFor="apartmentName" className="input-label-web">
                          Apartment Name
                        </label>
                        <input
                          id="apartmentName"
                          placeholder="Enter your apartment name"
                          value={apartmentName}
                          onChange={(event) => {
                            setApartmentName(event.target.value);
                            clearFieldError('apartmentName');
                          }}
                          className={`input-style-web border ${fieldErrors.apartmentName ? 'registration-input-error-web' : 'border-transparent'}`}
                        />
                        {fieldErrors.apartmentName && (
                          <p className="registration-error-web">{fieldErrors.apartmentName}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                      <div className="input-group-web">
                        <label htmlFor="city" className="input-label-web">
                          City
                        </label>
                        <input
                          id="city"
                          placeholder="Enter your city"
                          value={city}
                          onChange={(event) => {
                            setCity(event.target.value);
                            clearFieldError('city');
                          }}
                          className={`input-style-web border ${fieldErrors.city ? 'registration-input-error-web' : 'border-transparent'}`}
                        />
                        {fieldErrors.city && (
                          <p className="registration-error-web">{fieldErrors.city}</p>
                        )}
                      </div>

                      <div className="input-group-web">
                        <label htmlFor="state" className="input-label-web">
                          State
                        </label>
                        <input
                          id="state"
                          placeholder="Enter your state"
                          value={state}
                          onChange={(event) => {
                            setState(event.target.value);
                            clearFieldError('state');
                          }}
                          className={`input-style-web border ${fieldErrors.state ? 'registration-input-error-web' : 'border-transparent'}`}
                        />
                        {fieldErrors.state && (
                          <p className="registration-error-web">{fieldErrors.state}</p>
                        )}
                      </div>

                      <div className="input-group-web">
                        <label htmlFor="postalCode" className="input-label-web">
                          Postal Code
                        </label>
                        <input
                          id="postalCode"
                          inputMode="numeric"
                          placeholder="Enter your postal code"
                          value={postalCode}
                          onChange={(event) => {
                            setPostalCode(event.target.value);
                            clearFieldError('postalCode');
                          }}
                          className={`input-style-web border ${fieldErrors.postalCode ? 'registration-input-error-web' : 'border-transparent'}`}
                        />
                        {fieldErrors.postalCode && (
                          <p className="registration-error-web">{fieldErrors.postalCode}</p>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <RegistrationIdPicker
                    value={identificationDocument}
                    error={fieldErrors.identificationUri}
                    onChange={(document) => {
                      setIdentificationDocument(document);
                      clearFieldError('identificationUri');
                    }}
                  />
                )}

                <div className="mt-6 flex flex-row justify-end gap-3">
                  {step > 1 && (
                    <button
                      className={`bg-dark-teal rounded-md px-24 py-3 flex items-center justify-center ${running && 'cursor-not-allowed opacity-75'}`}
                      disabled={running}
                      onClick={handleBack}
                    >
                      {processingAction === 'continue' ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <p className="text-white text-sm font-semibold">Back</p>
                      )}
                    </button>
                  )}

                  {step < 3 ? (
                    <button
                      className={`bg-primary rounded-md px-24 py-3 flex items-center justify-center ${running && 'cursor-not-allowed opacity-75'}`}
                      disabled={running}
                      onClick={handleNextStep}
                    >
                      {processingAction === 'continue' ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <p className="text-white text-sm font-semibold">Continue</p>
                      )}
                    </button>
                  ) : (
                    <button
                      className={`bg-primary rounded-md px-24 py-3 flex items-center justify-center ${running && 'cursor-not-allowed opacity-75'}`}
                      disabled={running}
                      onClick={handleSaveUser}
                    >
                      {processingAction === 'save' ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <p className="text-white text-sm font-semibold">Save User</p>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <Modal
            closeModal={() => setError('')}
            heading={messageType === 'success' ? 'Success' : 'Validation Error'}
            message={error}
            cancelText={'Close'}
          />
        )}
        <HouseholdSelectorSheet
          visible={householdSelectorVisible}
          estateId={estateId}
          selected={selectedHousehold}
          onClose={() => setHouseholdSelectorVisible(false)}
          onSelect={(household) => {
            setSelectedHousehold(household);
            clearFieldError('householdId');
          }}
        />
      </div>
    </div>
  );
}

export default function AdminAddUserPage() {
  const { width } = useWindowDimensions();

  const isLargeScreen = width > getWidthBreakpoint();
  return isLargeScreen ? <RegisterUserWeb /> : <RegisterUser />;
}
