import { GenderType, UserRolesType } from './general';

export type User = {
  user_id: string;
  id?: string;
  first_name: string | null;
  last_name: string | null;
  home_address: string | null;
  email: string | null;
  phone_number: string | null;
  gender: GenderType;
  estate_name: string | null;
  role: UserRolesType;
  estate_id: string | null;
  household_id?: string | null;
  household_name?: string | null;
  household_primary_resident?: string | null;
  status: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  is_deleted?: false;
};

/** GET /users/profile/{user_id} — the user-service UserProfileResponse, field for field. */
export type UserProfileResponse = {
  user_id: string;
  first_name: string;
  last_name: string;
  home_address: string;
  email: string;
  phone_number: string;
  gender: 'male' | 'female' | 'prefer_not_to_say';
  role: 'root' | 'primary_admin' | 'admin' | 'resident' | 'security' | 'guest';
  estate_id: string;
  estate_name: string;
  household_name?: string | null;
  household_primary_resident?: string | null;
  status: boolean;
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
  role_summary?: {
    admin: number;
    guest: number;
    primary_admin: number;
    resident: number;
    security: number;
  };
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
