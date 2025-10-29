import { GenderType, RelationshipType } from './general';

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
