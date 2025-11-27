import { GenderType, UserRolesType } from './general';

export type User = {
	user_id: string;
	first_name: string | null;
	last_name: string | null;
	home_address: string | null;
	email: string | null;
	phone_number: string | null;
	gender: GenderType;
	estate_name: string | null;
	role: UserRolesType;
	estate_id: string | null;

	household_id: string | null;
	status: boolean | null;
	created_at: string | null;
	updated_at: string | null;
	is_deleted: false;
};

export type UpdatePasswordPayload = {
	success: boolean;
	message: string;
};
