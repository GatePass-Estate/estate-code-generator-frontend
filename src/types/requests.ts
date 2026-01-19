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

export type RequestStatus = 'approved' | 'declined' | 'pending';
