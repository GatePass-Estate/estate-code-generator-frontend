import { getRequests } from '@/src/lib/api/requests';
import { RequestItem, RequestType } from '@/src/types/requests';

export const PROFILE_FIELD_REQUEST_TYPES = {
  firstName: 'first_name_change',
  lastName: 'last_name_change',
  phoneNumber: 'phone_number_change',
  email: 'email_change',
  address: 'home_address_change',
} as const;

export type ProfileFieldKey = keyof typeof PROFILE_FIELD_REQUEST_TYPES;

export type ProfilePendingFields = Record<ProfileFieldKey, boolean>;

export type ProfilePendingFieldState = {
  hasPending: boolean;
  newValue: string | null;
  oldValue: string | null;
  requestId: string | null;
};

export type ProfilePendingFieldDetails = Record<ProfileFieldKey, ProfilePendingFieldState>;

const REQUEST_TYPE_TO_FIELD: Partial<Record<RequestType, ProfileFieldKey>> = {
  first_name_change: 'firstName',
  last_name_change: 'lastName',
  phone_number_change: 'phoneNumber',
  email_change: 'email',
  home_address_change: 'address',
};

export const EMPTY_PENDING_FIELD_DETAILS: ProfilePendingFieldDetails = {
  firstName: { hasPending: false, newValue: null, oldValue: null, requestId: null },
  lastName: { hasPending: false, newValue: null, oldValue: null, requestId: null },
  phoneNumber: { hasPending: false, newValue: null, oldValue: null, requestId: null },
  email: { hasPending: false, newValue: null, oldValue: null, requestId: null },
  address: { hasPending: false, newValue: null, oldValue: null, requestId: null },
};

export function mapPendingRequestsToFields(items: RequestItem[]): ProfilePendingFieldDetails {
  const details: ProfilePendingFieldDetails = {
    firstName: { hasPending: false, newValue: null, oldValue: null, requestId: null },
    lastName: { hasPending: false, newValue: null, oldValue: null, requestId: null },
    phoneNumber: { hasPending: false, newValue: null, oldValue: null, requestId: null },
    email: { hasPending: false, newValue: null, oldValue: null, requestId: null },
    address: { hasPending: false, newValue: null, oldValue: null, requestId: null },
  };

  for (const item of items) {
    if (item.status !== 'pending') continue;

    const fieldKey = REQUEST_TYPE_TO_FIELD[item.request_type];
    if (!fieldKey) continue;

    details[fieldKey] = {
      hasPending: true,
      newValue: item.new_value,
      oldValue: item.old_value,
      requestId: item.id,
    };
  }

  return details;
}

export function toPendingFieldFlags(details: ProfilePendingFieldDetails): ProfilePendingFields {
  return {
    firstName: details.firstName.hasPending,
    lastName: details.lastName.hasPending,
    phoneNumber: details.phoneNumber.hasPending,
    email: details.email.hasPending,
    address: details.address.hasPending,
  };
}

export async function fetchProfilePendingFields(
  residentId: string
): Promise<ProfilePendingFieldDetails> {
  const data = await getRequests({
    page: 1,
    limit: 20,
    status: 'pending',
    resident_id: residentId,
  });

  return mapPendingRequestsToFields(data.items);
}
