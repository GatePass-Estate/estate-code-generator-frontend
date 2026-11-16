import type { ProfilePendingFieldDetails } from '@/src/features/profile/utils/profilePendingFields';
import type {
  ProfileEditForm,
  ProfileEditPendingValues,
} from '@/src/features/profile/utils/submitProfileEdits';

type ProfileFormUser = {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  home_address?: string | null;
  phone_number?: string | null;
};

export const PROFILE_EDIT_LEAVE_DELAY_MS = 1500;

/** The edit form filled with the signed-in user's current details. */
export function profileFormFromUser(user: ProfileFormUser): ProfileEditForm {
  return {
    firstName: user.first_name || '',
    lastName: user.last_name || '',
    email: user.email || '',
    address: user.home_address || '',
    phoneNumber: user.phone_number || '',
  };
}

/**
 * The edit form pre-filled with pending admin requests' new values (falling back to the current
 * details), plus those pending values, which "unchanged" is then measured against.
 */
export function prefillProfileForm(
  user: ProfileFormUser,
  details: ProfilePendingFieldDetails
): { form: ProfileEditForm; pendingValues: ProfileEditPendingValues } {
  const pending = (field: keyof ProfileEditPendingValues) =>
    details[field].hasPending ? details[field].newValue : null;
  const pendingOr = (field: keyof ProfileEditPendingValues, current?: string | null) =>
    details[field].hasPending && details[field].newValue ? details[field].newValue : current || '';

  return {
    pendingValues: {
      firstName: pending('firstName'),
      lastName: pending('lastName'),
      email: pending('email'),
      address: pending('address'),
    },
    form: {
      firstName: pendingOr('firstName', user.first_name),
      lastName: pendingOr('lastName', user.last_name),
      email: pendingOr('email', user.email),
      address: pendingOr('address', user.home_address),
      phoneNumber: user.phone_number || '',
    },
  };
}
