import { GenderType, RelationshipType } from './general';

export type GuestsProps = {
	searchQuery: string;
	guests: Guest[];
	loading: boolean;
	deleting: boolean;
	fetchGuests: () => void;
	deleteGuest: (id: string) => void;
	setSearchQuery: (query: string) => void;
	setLoading: (loading: boolean) => void;
	setDeleting: (deleting: boolean) => void;
	filteredGuests: Guest[];
};

export interface Guest {
	id: string;
	resident_id: string;
	guest_name: string;
	gender: GenderType;
	guest_phone_number: string | null;
	relationship: RelationshipType;
	created_at: string;
	updated_at: string;
	is_deleted: boolean;
}

export type GuestApiResponse = {
	items: Guest[];
	total: number;
	page: number;
	limit: number;
};

export type DeleteGuestResponse = {
	is_deleted: boolean;
	deleted_at: string;
};

export type CreateGuestPayload = {
	guest_name: string;
	gender: string;
	relationship: string;
	resident_id: string;
};

export type CreateGuestApiResponse = {
	id: string;
	created_at: string;
};

export type GuestDetails = {
	visitor_fullname: string;
	relationship_with_resident: string;
	gender: string;
	resident_name: string;
	resident_address: string;
	resident_email: string;
	resident_phone_number: string;
	code: string;
};
