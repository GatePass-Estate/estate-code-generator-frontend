import type { FormData, FormErrors, GenderType, UserRolesType } from '@/src/shared/types/general';
import type { RegisterUserPayload } from '@/src/features/users/types/user';

export const REGISTRATION_GENDER_OPTIONS: {
  label: string;
  value: Exclude<GenderType, null>;
}[] = [
  { label: 'Female', value: 'female' },
  { label: 'Male', value: 'male' },
  { label: "I'd prefer not to say", value: 'prefer_not_to_say' },
];

export const REGISTRATION_ROLE_OPTIONS = [
  { label: 'Resident', value: 'resident' },
  { label: 'Security Personnel', value: 'security' },
] as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_PATTERN = /^\p{L}+(?:[ '\u2019-]\p{L}+)*$/u;
const PHONE_PATTERN = /^\+?[0-9 ()-]+$/;

type PersonalTextField = 'firstName' | 'lastName' | 'email' | 'phoneNumber';

export function validateRegistrationPersonalField(
  field: PersonalTextField,
  value: string
): string | undefined {
  const trimmedValue = value.trim();

  if (field === 'firstName') {
    if (!trimmedValue) return 'First name is required';
    if (!NAME_PATTERN.test(trimmedValue)) return 'First name can only contain letters';
  }

  if (field === 'lastName') {
    if (!trimmedValue) return 'Last name is required';
    if (!NAME_PATTERN.test(trimmedValue)) return 'Last name can only contain letters';
  }

  if (field === 'phoneNumber') {
    if (!trimmedValue) return 'Phone number is required';
    if (!PHONE_PATTERN.test(trimmedValue)) return 'Phone number can only contain numbers';
  }

  if (field === 'email') {
    if (!trimmedValue) return 'Email address is required';
    if (!EMAIL_PATTERN.test(trimmedValue)) return 'Enter a valid email address';
  }

  return undefined;
}

type PersonalDetails = Pick<
  FormData,
  'firstName' | 'lastName' | 'email' | 'phoneNumber' | 'gender' | 'userType'
>;

export function validateRegistrationPersonalDetails(values: PersonalDetails): FormErrors {
  const errors: FormErrors = {};

  const firstNameError = validateRegistrationPersonalField('firstName', values.firstName);
  const lastNameError = validateRegistrationPersonalField('lastName', values.lastName);
  const phoneNumberError = validateRegistrationPersonalField('phoneNumber', values.phoneNumber);
  const emailError = validateRegistrationPersonalField('email', values.email);

  if (firstNameError) errors.firstName = firstNameError;
  if (lastNameError) errors.lastName = lastNameError;
  if (phoneNumberError) errors.phoneNumber = phoneNumberError;
  if (emailError) errors.email = emailError;

  if (values.gender == null) errors.gender = 'Gender is required';
  if (values.userType !== 'resident' && values.userType !== 'security') {
    errors.userType = 'User type is required';
  }

  return errors;
}

type AddressDetails = Pick<
  FormData,
  'householdId' | 'apartmentNumber' | 'apartmentName' | 'city' | 'state' | 'postalCode'
>;

export function validateRegistrationAddress(values: AddressDetails): FormErrors {
  const errors: FormErrors = {};

  if (!values.householdId) errors.householdId = 'Select or add a household';
  if (!values.apartmentNumber.trim()) {
    errors.apartmentNumber = 'Apartment number or suite is required';
  }
  if (!values.apartmentName.trim()) errors.apartmentName = 'Apartment name is required';
  if (!values.city.trim()) errors.city = 'City is required';
  if (!values.state.trim()) errors.state = 'State is required';
  if (!values.postalCode.trim()) errors.postalCode = 'Postal code is required';

  return errors;
}

/** The body both the native and web add-user screens post. */
export function buildRegisterUserPayload(input: {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: UserRolesType;
  gender: GenderType;
  estateId: string;
  householdId: string | null;
  address: AddressDetails;
}): RegisterUserPayload {
  return {
    first_name: input.firstName,
    last_name: input.lastName,
    email: input.email,
    phone_number: input.phoneNumber,
    role: input.role,
    gender: input.gender,
    estate_id: input.estateId,
    home_address: formatRegistrationAddress(input.address),
    household_id: input.householdId,
  };
}

export function formatRegistrationAddress(values: AddressDetails): string {
  return [
    values.apartmentNumber.trim(),
    values.apartmentName.trim(),
    values.city.trim(),
    values.state.trim(),
    values.postalCode.trim(),
  ]
    .filter(Boolean)
    .join(', ');
}

export function validateRegistrationIdentification(uri: string | null): FormErrors {
  return uri ? {} : { identificationUri: 'Select a government-issued ID' };
}
