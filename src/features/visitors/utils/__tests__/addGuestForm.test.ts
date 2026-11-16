import {
  GENDER_OPTIONS,
  addGuestFormError,
  optionLabel,
} from '@/src/features/visitors/utils/addGuestForm';

const form = {
  name: 'Ada',
  gender: 'female' as const,
  relationship: 'friend' as const,
  otherRelationship: '',
};

describe('addGuestFormError', () => {
  it('requires a name on both platforms', () => {
    expect(addGuestFormError({ ...form, name: '  ' }, 'native')).toBe(
      "Please enter the guest's name."
    );
    expect(addGuestFormError({ ...form, name: '' }, 'web')).toBe("Please enter the guest's name.");
  });

  it('mobile checks relationship before gender', () => {
    expect(addGuestFormError({ ...form, relationship: null, gender: null }, 'native')).toBe(
      'Please select your relationship with the guest.'
    );
    expect(addGuestFormError({ ...form, gender: null }, 'native')).toBe('Please select a gender.');
    expect(addGuestFormError(form, 'native')).toBeNull();
  });

  it('web asks for free text when "other" is picked', () => {
    expect(addGuestFormError({ ...form, gender: null }, 'web')).toBe('Please select a gender.');
    expect(addGuestFormError({ ...form, relationship: 'other' }, 'web')).toBe(
      'Please select or enter a relationship.'
    );
    expect(
      addGuestFormError({ ...form, relationship: 'other', otherRelationship: 'Tutor' }, 'web')
    ).toBeNull();
  });
});

describe('optionLabel', () => {
  it('finds the label for a value', () => {
    expect(optionLabel(GENDER_OPTIONS, 'male')).toBe('Male');
    expect(optionLabel(GENDER_OPTIONS, null)).toBeUndefined();
  });
});
