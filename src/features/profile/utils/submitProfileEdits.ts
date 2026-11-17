import { refreshCurrentUser } from '@/src/features/auth/hooks/useRefreshUser';
import {
  checkPendingRequests,
  createRequest,
  updatePendingRequest,
} from '@/src/features/admin/services/requests';
import { RequestType } from '@/src/features/admin/types/requests';
import { updateUserPhone } from '@/src/features/users/services/user';
import { errorMessage } from '@/src/shared/services/api/errors';

export type ProfileEditForm = {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  phoneNumber: string;
};

type ProfileEditUser = {
  user_id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  home_address?: string | null;
  phone_number?: string | null;
};

/**
 * New values of the admin requests still pending for this user. The edit form is pre-filled with
 * them, so they are what the form must be compared against.
 */
export type ProfileEditPendingValues = Partial<
  Record<'firstName' | 'lastName' | 'email' | 'address', string | null>
>;

export type ChangedField = {
  type: RequestType;
  old: string;
  new: string;
  label: string;
};

export type ProfileEditResult =
  | { status: 'unchanged' }
  | { status: 'invalid'; errors: string[] }
  | { status: 'failed'; errors: string[] }
  | { status: 'saved'; message: string };

const EDITABLE_FIELDS: {
  type: RequestType;
  label: string;
  key: keyof ProfileEditPendingValues;
  current: (user: ProfileEditUser) => string | null | undefined;
  next: (form: ProfileEditForm) => string;
}[] = [
  {
    type: 'first_name_change',
    key: 'firstName',
    label: 'First Name',
    current: (user) => user.first_name,
    next: (form) => form.firstName,
  },
  {
    type: 'last_name_change',
    key: 'lastName',
    label: 'Last Name',
    current: (user) => user.last_name,
    next: (form) => form.lastName,
  },
  {
    type: 'email_change',
    key: 'email',
    label: 'Email Address',
    current: (user) => user.email,
    next: (form) => form.email,
  },
  {
    type: 'home_address_change',
    key: 'address',
    label: 'Address',
    current: (user) => user.home_address,
    next: (form) => form.address,
  },
];

function successMessage(requestCount: number, phoneChanged: boolean) {
  if (requestCount > 0 && phoneChanged) {
    return requestCount === 1
      ? 'Phone number updated. 1 request submitted for admin approval.'
      : `Phone number updated. ${requestCount} requests submitted for admin approval.`;
  }
  if (requestCount > 0) {
    return requestCount === 1
      ? '1 request submitted successfully. Awaiting admin approval.'
      : `${requestCount} requests submitted successfully. Awaiting admin approval.`;
  }
  return 'Phone number updated successfully.';
}

/**
 * Fields whose form value differs from what the user would otherwise see: the pending request's
 * new value when there is one, else the current profile value. `old` is always the current
 * profile value (what a new request changes from).
 */
export function getChangedProfileFields(
  user: ProfileEditUser,
  form: ProfileEditForm,
  pending: ProfileEditPendingValues = {}
): ChangedField[] {
  return EDITABLE_FIELDS.flatMap((field) => {
    const current = field.current(user) || '';
    const effective = pending[field.key] || current;
    const next = field.next(form);
    if (next === effective) return [];
    return [{ type: field.type, old: current, new: next, label: field.label }];
  });
}

/**
 * Phone numbers save immediately. Name, email, and address go through admin edit requests,
 * updating a pending request when one already exists.
 */
export async function submitProfileEdits(
  user: ProfileEditUser,
  form: ProfileEditForm,
  pending?: ProfileEditPendingValues
): Promise<ProfileEditResult> {
  const changedFields = getChangedProfileFields(user, form, pending);

  const phoneChanged = form.phoneNumber !== (user.phone_number || '');
  if (changedFields.length === 0 && !phoneChanged) return { status: 'unchanged' };

  try {
    if (phoneChanged) {
      if (!form.phoneNumber.trim()) {
        return { status: 'invalid', errors: ['Phone number is required'] };
      }
      await updateUserPhone(user.user_id, form.phoneNumber.trim());
    }

    let submitted = 0;
    if (changedFields.length > 0) {
      const pendingResults = await Promise.allSettled(
        changedFields.map((field) => checkPendingRequests(field.type))
      );
      const createRequests: ChangedField[] = [];
      const updateRequests: { field: ChangedField; requestId: string }[] = [];
      const errors: string[] = [];

      pendingResults.forEach((result, index) => {
        const field = changedFields[index];
        if (result.status === 'fulfilled') {
          if (result.value.has_pending_request && result.value.pending_request) {
            updateRequests.push({ field, requestId: result.value.pending_request.id });
          } else {
            createRequests.push(field);
          }
          return;
        }
        errors.push(`Error checking ${field.label}: ${errorMessage(result.reason) || ''}`);
      });

      if (errors.length > 0) return { status: 'failed', errors };

      submitted = createRequests.length + updateRequests.length;
      if (submitted > 0) {
        await Promise.all([
          ...createRequests.map((field) => createRequest(field.type, field.old, field.new)),
          ...updateRequests.map((request) =>
            updatePendingRequest(request.requestId, request.field.new)
          ),
        ]);
      }
    }

    await refreshCurrentUser();
    return { status: 'saved', message: successMessage(submitted, phoneChanged) };
  } catch (error: unknown) {
    return { status: 'failed', errors: [errorMessage(error) || 'Failed to save changes'] };
  }
}
