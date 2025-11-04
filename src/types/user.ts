import { GenderType, UserRolesType } from './general';

export type User = {
	user_id: string;
	first_name: string | null;
	last_name: string | null;
	home_address: string | null;
	email: string | null;
	phone_number: string | null;
	gender: GenderType;
	role: UserRolesType;
	estate_name: string | null;
	estate_id: string | null;
	household_primary_resident: string | null;
	status: boolean | null;
};

export type UpdatePasswordPayload = {
	success: boolean;
	message: string;
};
