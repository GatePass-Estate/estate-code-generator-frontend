import {
  formatRegistrationAddress,
  validateRegistrationAddress,
  validateRegistrationIdentification,
  validateRegistrationPersonalDetails,
} from '@/src/lib/registrationValidation';

const validDetails = {
  firstName: 'Sandra',
  lastName: 'Happiness',
  email: 'sandra@example.com',
  phoneNumber: '09033902020',
  gender: 'female' as const,
  userType: 'resident' as const,
};

describe('validateRegistrationPersonalDetails', () => {
  it('accepts complete resident details', () => {
    expect(validateRegistrationPersonalDetails(validDetails)).toEqual({});
  });

  it('accepts security personnel as a supported user type', () => {
    expect(validateRegistrationPersonalDetails({ ...validDetails, userType: 'security' })).toEqual(
      {}
    );
  });

  it('returns errors for all required personal-detail fields', () => {
    expect(
      validateRegistrationPersonalDetails({
        firstName: ' ',
        lastName: '',
        email: '',
        phoneNumber: '',
        gender: null,
        userType: null,
      })
    ).toEqual({
      firstName: 'First name is required',
      lastName: 'Last name is required',
      phoneNumber: 'Phone number is required',
      email: 'Email address is required',
      gender: 'Gender is required',
      userType: 'User type is required',
    });
  });

  it('rejects an invalid email address', () => {
    expect(
      validateRegistrationPersonalDetails({ ...validDetails, email: 'not-an-email' })
    ).toMatchObject({ email: 'Enter a valid email address' });
  });
});

describe('registration address helpers', () => {
  const address = {
    householdId: 'household-1',
    apartmentNumber: 'Apartment 34',
    apartmentName: 'Woko Lane',
    city: 'Ikeja',
    state: 'Lagos',
    postalCode: '100001',
  };

  it('accepts a complete household address', () => {
    expect(validateRegistrationAddress(address)).toEqual({});
  });

  it('reports every missing household address field', () => {
    expect(
      validateRegistrationAddress({
        householdId: null,
        apartmentNumber: '',
        apartmentName: '',
        city: '',
        state: '',
        postalCode: '',
      })
    ).toEqual({
      householdId: 'Select or add a household',
      apartmentNumber: 'Apartment number or suite is required',
      apartmentName: 'Apartment name is required',
      city: 'City is required',
      state: 'State is required',
      postalCode: 'Postal code is required',
    });
  });

  it('formats structured fields for the existing home_address API field', () => {
    expect(formatRegistrationAddress(address)).toBe(
      'Apartment 34, Woko Lane, Ikeja, Lagos, 100001'
    );
  });
});

describe('registration identification validation', () => {
  it('requires a selected identification document', () => {
    expect(validateRegistrationIdentification(null)).toEqual({
      identificationUri: 'Select a government-issued ID',
    });
  });

  it('accepts a locally selected identification document', () => {
    expect(validateRegistrationIdentification('file:///identification.pdf')).toEqual({});
  });
});
