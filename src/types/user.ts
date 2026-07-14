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
  profile_picture_url?: string | null;
  status: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  is_deleted?: false;
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

export type DocumentType = 'profile_picture' | 'id_card';
export type DocumentStatus = 'pending' | 'active' | 'archived';

export type DocumentMetadataItem = {
  document_type: DocumentType;
  content_type: string;
  document_status?: DocumentStatus | null;
  document_id?: string | null;
  view_url?: string | null;
  download_url?: string | null;
};

export type UserDocumentsMetadataResponse = {
  documents: DocumentMetadataItem[];
};
