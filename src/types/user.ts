import { GenderType, UserRolesType } from './general';

export type User = {
	user_id: string;
	id: string;
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
	status: boolean;
	created_at: string | null;
	updated_at: string | null;
	is_deleted: false;
};

export type UpdatePasswordPayload = {
	success: boolean;
	message: string;
};

export type AllUsers = {
	total: number;
	page: number;
	limit: number;
	items: User[];
};

export type RegisterUserPayload = {
	first_name: string;
	last_name: string;
	home_address: string;
	email: string;
	role: UserRolesType;
	gender: GenderType;
	estate_id: string;
	phone_number: string | null;
	household_id: string | null;
};

export type UpdateUserRoleResponse = {
	user_id: string;
	estate_id: string;
	message: string;
	role: UserRolesType;
};
