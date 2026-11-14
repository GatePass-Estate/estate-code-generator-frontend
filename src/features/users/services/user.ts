import { raiseApiError } from '@/src/shared/services/api/errors';
import Api from '@/src/shared/services/api/client';
import { queryClient } from '@/src/shared/services/api/queryClient';
import { queryKeys } from '@/src/shared/services/api/queryKeys';
import {
  AllUsers,
  RegisterUserPayload,
  UpdatePasswordPayload,
  UpdateUserRoleResponse,
  User,
  UserProfileResponse,
} from '@/src/features/users/types/user';
import {
  DocumentMetadataItem,
  UserDocumentsMetadataResponse,
} from '@/src/features/profile/types/userDocuments';

export const updateUserPhone = async (
  userId: string,
  phoneNumber: string
): Promise<{ user_id?: string; phone_number?: string; message?: string }> => {
  try {
    const api = Api();
    const axiosRes = await api.patch(`/users/${encodeURIComponent(userId)}/phone`, null, {
      params: { phone_number: phoneNumber },
    });
    return axiosRes.data;
  } catch (error: unknown) {
    raiseApiError(error, 'Could not update phone number', true);
  }
};

export const updatepassword = async (payload: {
  user_id: string;
  current_password: string;
  new_password: string;
}): Promise<UpdatePasswordPayload> => {
  try {
    const api = Api();

    const axiosRes = await api.post(`/users/password/update`, {
      user_id: payload.user_id,
      current_password: payload.current_password,
      new_password: payload.new_password,
    });

    const data = axiosRes.data;

    return data;
  } catch (error: unknown) {
    raiseApiError(error, 'An error occured', true);
  }
};

/**
 * Estate admin user detail. Uses `GET /users/profile/{id}` (same-estate + can_register_users).
 * Do not use `GET /users/{id}` here — that route is root-only and returns
 * "You are not authorized to view this user." for primary/admin.
 */
export const getUserByIdAdmin = async (id: string): Promise<User> => {
  try {
    const api = Api();
    const axiosRes = await api.get<UserProfileResponse>(`/users/profile/${encodeURIComponent(id)}`);
    const data = axiosRes.data;
    const userId = String(data.user_id);

    return {
      user_id: userId,
      id: userId,
      first_name: data.first_name,
      last_name: data.last_name,
      home_address: data.home_address,
      email: data.email,
      phone_number: data.phone_number,
      gender: data.gender,
      estate_name: data.estate_name,
      role: data.role,
      estate_id: data.estate_id,
      household_name: data.household_name ?? null,
      household_primary_resident: data.household_primary_resident ?? null,
      status: data.status,
    };
  } catch (error: unknown) {
    raiseApiError(error, 'An error occured', true);
  }
};

export const getUserById = async (id: string): Promise<UserProfileResponse> => {
  try {
    const api = Api();

    const axiosRes = await api.get(`/users/profile/${encodeURIComponent(id)}`);
    const data = axiosRes.data;

    return data;
  } catch (error: unknown) {
    raiseApiError(error, 'An error occured', true);
  }
};

export const getUserProfilePictureUrl = async (userId: string): Promise<string | null> => {
  try {
    const api = Api();
    const axiosRes = await api.get<UserDocumentsMetadataResponse>(
      `/users/documents/${encodeURIComponent(userId)}`,
      {
        params: {
          document_type: 'profile_picture',
          document_status: 'active',
        },
      }
    );

    const profilePicture = axiosRes.data.documents.find(
      (document: DocumentMetadataItem) =>
        document.document_type === 'profile_picture' && document.view_url
    );

    if (!profilePicture?.view_url) return null;

    if (/^https?:\/\//i.test(profilePicture.view_url)) {
      return profilePicture.view_url;
    }

    const baseUrl = process.env.EXPO_PUBLIC_USER_SERVICE_API_URL;
    if (!baseUrl) throw new Error('EXPO_PUBLIC_USER_SERVICE_API_URL is missing');
    return `${baseUrl}${profilePicture.view_url.startsWith('/') ? '' : '/'}${profilePicture.view_url}`;
  } catch {
    return null;
  }
};

/**
 * `GET /users/all` — estate roster with status + pagination (used by admin home / billing).
 * Does not support name/role search; use `searchEstateUsers` for the All Users screen.
 */
export const getAllEstateUsers = async (
  page: number = 1,
  limit: number = 5,
  status: 'all' | 'true' | 'false' = 'all'
): Promise<AllUsers> => {
  try {
    const api = Api();
    const axiosRes = await api.get('/users/all', {
      params: { page, limit, status },
    });
    return axiosRes.data;
  } catch (error: unknown) {
    raiseApiError(error, 'An error occured', true);
  }
};

/** Filters supported by `GET /users/` (backend `list_users` / `SearchUserRequest`). */
export type SearchEstateUsersParams = {
  page?: number;
  limit?: number;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  role?: 'root' | 'primary_admin' | 'admin' | 'resident' | 'security' | 'guest' | null;
  /** Activation status. Omit for everyone; `true` / `false` for validated filters. */
  status?: boolean | null;
};

/**
 * `GET /users/` — server-side search + role + status + pagination.
 * Prefer this for All Users filters (PERF-03).
 */
export const searchEstateUsers = async (
  params: SearchEstateUsersParams = {}
): Promise<AllUsers> => {
  try {
    const api = Api();
    // No trailing slash — some gateways 307 `/users/` → `/users` and drop query params,
    // which made role/search filters look broken (always the same first page).
    const axiosRes = await api.get('/users', {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        ...(params.first_name?.trim() ? { first_name: params.first_name.trim() } : {}),
        ...(params.last_name?.trim() ? { last_name: params.last_name.trim() } : {}),
        ...(params.email?.trim() ? { email: params.email.trim() } : {}),
        ...(params.role ? { role: params.role } : {}),
        ...(params.status === null || params.status === undefined
          ? {}
          : { status: String(params.status) }),
      },
      // Keep `status=false` — axios can drop falsy values depending on serializer.
      paramsSerializer: {
        serialize: (p) =>
          Object.entries(p)
            .filter(([, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
            .join('&'),
      },
    });
    return axiosRes.data;
  } catch (error: unknown) {
    raiseApiError(error, 'An error occured', true);
  }
};

/** Map the All Users search box onto the fields `GET /users/` actually supports. */
export function searchTextToUserFilters(
  search: string
): Pick<SearchEstateUsersParams, 'first_name' | 'last_name' | 'email'> {
  const trimmed = search.trim();
  if (!trimmed) return {};
  if (trimmed.includes('@')) return { email: trimmed };
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return { first_name: parts[0], last_name: parts.slice(1).join(' ') };
  }
  return { first_name: trimmed };
}

/**
 * Admin changes to a user (add, remove, role change) change the estate's user list and seat count.
 * Screens call these services directly, so the cache is refreshed here rather than in each screen.
 */
function refreshEstateUserCaches() {
  void queryClient.invalidateQueries({ queryKey: queryKeys.estateUsers.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
}

export const registerUser = async (payload: RegisterUserPayload): Promise<User> => {
  try {
    const api = Api();

    const axiosRes = await api.post(`/users/register`, payload);
    const data = axiosRes.data;
    refreshEstateUserCaches();

    return data;
  } catch (error: unknown) {
    raiseApiError(error, 'An error occured', true);
  }
};

export const activateUser = async (payload: {
  token: string;
  new_password: string;
}): Promise<User> => {
  try {
    const api = Api();

    const axiosRes = await api.post(`/users/validate/account`, payload);
    const data = axiosRes.data;

    return data;
  } catch (error: unknown) {
    raiseApiError(error, 'An error occured', true);
  }
};

export const promoteToAdmin = async (user_id: string): Promise<UpdateUserRoleResponse> => {
  try {
    const api = Api();

    const axiosRes = await api.post(`/admins/promote`, null, { params: { user_id } });
    const data = axiosRes.data;
    refreshEstateUserCaches();

    return data;
  } catch (error: unknown) {
    raiseApiError(error, 'An error occured', true);
  }
};
export const demoteToResident = async (user_id: string): Promise<UpdateUserRoleResponse> => {
  try {
    const api = Api();

    const axiosRes = await api.post(`/admins/demote`, null, { params: { user_id } });
    const data = axiosRes.data;
    refreshEstateUserCaches();

    return data;
  } catch (error: unknown) {
    raiseApiError(error, 'An error occured', true);
  }
};

export const resendEmailVerification = async (user_id: string): Promise<void> => {
  try {
    const api = Api();
    await api.post(`/users/${encodeURIComponent(user_id)}/resend-verification`);
  } catch (error: unknown) {
    raiseApiError(error, 'An error occured', true);
  }
};

export const deleteUser = async (user_id: string): Promise<void> => {
  try {
    const api = Api();
    await api.delete(`/users/${encodeURIComponent(user_id)}`);
    refreshEstateUserCaches();
  } catch (error: unknown) {
    raiseApiError(error, 'An error occured', true);
  }
};

export const deactivateUser = async (user_id: string): Promise<void> => {
  try {
    const api = Api();
    await api.post(`/users/${encodeURIComponent(user_id)}/close`, { close_at: null });
    refreshEstateUserCaches();
  } catch (error: unknown) {
    raiseApiError(error, 'An error occured', true);
  }
};

export const deleteAccount = async (): Promise<void> => {
  try {
    const api = Api();
    await api.delete(`/users/me/account`);
  } catch (error: unknown) {
    raiseApiError(error, 'An error occured', true);
  }
};
