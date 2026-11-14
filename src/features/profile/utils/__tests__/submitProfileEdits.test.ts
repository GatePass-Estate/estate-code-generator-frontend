import {
  getChangedProfileFields,
  submitProfileEdits,
} from '@/src/features/profile/utils/submitProfileEdits';
import { createRequest, updatePendingRequest } from '@/src/features/admin/services/requests';

jest.mock('@/src/features/auth/hooks/useRefreshUser', () => ({ refreshCurrentUser: jest.fn() }));
jest.mock('@/src/features/admin/services/requests', () => ({
  checkPendingRequests: jest.fn(),
  createRequest: jest.fn(),
  updatePendingRequest: jest.fn(),
}));
jest.mock('@/src/features/users/services/user', () => ({ updateUserPhone: jest.fn() }));
jest.mock('@/src/shared/services/api/errors', () => ({ errorMessage: jest.fn() }));

const user = {
  user_id: 'u1',
  first_name: 'Ada',
  last_name: 'Obi',
  email: 'ada@example.com',
  home_address: '1 Road',
  phone_number: '0800',
};

const form = {
  firstName: 'Ada',
  lastName: 'Obi',
  email: 'ada@example.com',
  address: '1 Road',
  phoneNumber: '0800',
};

describe('getChangedProfileFields', () => {
  it('compares with the current profile when nothing is pending', () => {
    expect(getChangedProfileFields(user, form)).toEqual([]);
    expect(getChangedProfileFields(user, { ...form, firstName: 'Adaeze' })).toEqual([
      { type: 'first_name_change', old: 'Ada', new: 'Adaeze', label: 'First Name' },
    ]);
  });

  it('treats a form pre-filled with pending values as unchanged', () => {
    const pending = { firstName: 'Adaeze', address: '2 Street' };
    const prefilled = { ...form, firstName: 'Adaeze', address: '2 Street' };
    expect(getChangedProfileFields(user, prefilled, pending)).toEqual([]);
  });

  it('reports an edit on top of a pending value, keeping the current value as old', () => {
    const pending = { firstName: 'Adaeze' };
    expect(getChangedProfileFields(user, { ...form, firstName: 'Ada-Eze' }, pending)).toEqual([
      { type: 'first_name_change', old: 'Ada', new: 'Ada-Eze', label: 'First Name' },
    ]);
  });

  it('falls back to the current value when the pending value is empty', () => {
    expect(getChangedProfileFields(user, form, { email: null, lastName: '' })).toEqual([]);
  });
});

describe('submitProfileEdits', () => {
  it('does not re-submit pending requests when Send is pressed without edits', async () => {
    const pending = { firstName: 'Adaeze' };
    const result = await submitProfileEdits(user, { ...form, firstName: 'Adaeze' }, pending);
    expect(result).toEqual({ status: 'unchanged' });
    expect(createRequest).not.toHaveBeenCalled();
    expect(updatePendingRequest).not.toHaveBeenCalled();
  });
});
