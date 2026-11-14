// Mirrors the user-service OpenAPI schema GetEditRequestResponse.
export type RequestItem = {
  id: string;
  resident_id: string;
  estate_id: string;
  request_type: RequestType;
  old_value: string;
  new_value?: string | null;
  status: RequestStatus;
  reviewed_by?: string | null;
  created_at: string;
  updated_at?: string | null;
  last_reminded_at?: string | null;
  is_deleted?: boolean;
};

export type GetRequestsResponse = {
  total: number;
  page: number;
  limit: number;
  items: RequestItem[];
};

export interface EditRequestView {
  id: string;
  requestType: RequestType;
  oldValue: string;
  newValue: string | null;
  createdAt: string;
}

export type RequestType =
  | 'home_address_change'
  | 'vacate_residence'
  | 'email_change'
  | 'first_name_change'
  | 'last_name_change'
  | 'gender_change'
  | 'phone_number_change'
  | 'id_change';

export type RequestStatus = 'approved' | 'rejected' | 'pending';

export type PendingRequestsResponse = {
  has_pending_request: boolean;
  pending_request: RequestItem | null;
};

export type SearchRequestPayload = {
  page: number;
  limit: number;
  request_type?: RequestType;
  status?: RequestStatus;
  resident_id?: string;
  from_date?: string;
  to_date?: string;
};

/** PATCH /requests/edit/{id}/status — UpdateRequestStatusResponse. */
export type EditRequestResponse = {
  id: string;
  status: RequestStatus;
  reviewed_by: string;
  updated_at: string;
};

/** POST /requests/edit — CreateEditRequestResponse. */
export type CreateEditRequestResponse = {
  id: string;
  created_at: string;
};

/** PATCH /requests/edit/{id} — UpdatePendingRequestResponse. */
export type UpdatePendingRequestResponse = {
  id: string;
  new_value: string;
  updated_at: string;
};

export type RemindAdminsResponse = {
  success: boolean;
  message: string;
  next_remind_after: string;
};
