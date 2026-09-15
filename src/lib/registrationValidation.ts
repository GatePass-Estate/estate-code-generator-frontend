import type { FormData, FormErrors, GenderType } from '@/src/types/general';

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

type PersonalDetails = Pick<
  FormData,
  'firstName' | 'lastName' | 'email' | 'phoneNumber' | 'gender' | 'userType'
>;

export function validateRegistrationPersonalDetails(values: PersonalDetails): FormErrors {
  const errors: FormErrors = {};

  if (!values.firstName.trim()) errors.firstName = 'First name is required';
  if (!values.lastName.trim()) errors.lastName = 'Last name is required';

  if (!values.phoneNumber.trim()) errors.phoneNumber = 'Phone number is required';

  if (!values.email.trim()) errors.email = 'Email address is required';
  else if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = 'Enter a valid email address';

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
