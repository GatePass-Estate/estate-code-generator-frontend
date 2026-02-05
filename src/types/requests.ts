export type RequestItem = {
	id: string;
	resident_id: string;
	estate_id: string;
	request_type: RequestType;
	old_value: string;
	status: RequestStatus;
	created_at: string;
	new_value: string | null;
	reviewed_by: string | null;
	updated_at: string;
	is_deleted: boolean;
};

export type GetRequestsResponse = {
	total: number;
	page: number;
	limit: number;
	items: RequestItem[];
};

export interface EditRequestView {
	id: string;
	userName: string;
	location: string;
	selected: boolean;
}

export type RequestType = 'home_address_change' | 'vacate_residence' | 'email_change' | 'first_name_change' | 'last_name_change' | 'gender_change' | 'phone_number_change';

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

export type EditRequestResponse = {
	id: string;
	status: RequestStatus;
	reviewed_by: string;
	updated_at: string;
};
