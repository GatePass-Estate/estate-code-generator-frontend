import {
  prefillProfileForm,
  profileFormFromUser,
} from '@/src/features/profile/utils/profileEditForm';
import { EMPTY_PENDING_FIELD_DETAILS } from '@/src/features/profile/utils/profilePendingFields';

jest.mock('@/src/features/admin/services/requests', () => ({ getRequests: jest.fn() }));

const user = {
  first_name: 'Ada',
  last_name: 'Obi',
  email: 'ada@example.com',
  home_address: '1 Road',
  phone_number: '0800',
};

describe('profileFormFromUser', () => {
  it('maps the user and blanks missing values', () => {
    expect(profileFormFromUser(user)).toEqual({
      firstName: 'Ada',
      lastName: 'Obi',
      email: 'ada@example.com',
      address: '1 Road',
      phoneNumber: '0800',
    });
    expect(profileFormFromUser({ first_name: null })).toEqual({
      firstName: '',
      lastName: '',
      email: '',
      address: '',
      phoneNumber: '',
    });
  });
});

describe('prefillProfileForm', () => {
  it('uses current details when nothing is pending', () => {
    const { form, pendingValues } = prefillProfileForm(user, EMPTY_PENDING_FIELD_DETAILS);
    expect(form).toEqual(profileFormFromUser(user));
    expect(pendingValues).toEqual({
      firstName: null,
      lastName: null,
      email: null,
      address: null,
    });
  });

  it('pre-fills pending new values', () => {
    const details = {
      ...EMPTY_PENDING_FIELD_DETAILS,
      email: { hasPending: true, newValue: 'new@example.com', oldValue: null, requestId: 'r1' },
      address: { hasPending: true, newValue: null, oldValue: null, requestId: 'r2' },
    };
    const { form, pendingValues } = prefillProfileForm(user, details);
    expect(form.email).toBe('new@example.com');
    // A pending request without a new value keeps the current value in the form.
    expect(form.address).toBe('1 Road');
    expect(form.phoneNumber).toBe('0800');
    expect(pendingValues.email).toBe('new@example.com');
    expect(pendingValues.address).toBeNull();
  });
});
