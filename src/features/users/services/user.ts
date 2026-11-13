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

export const getUserByIdAdmin = async (id: string): Promise<User> => {
  try {
    const api = Api();

    const axiosRes = await api.get(`/users/${id}`);
    const data = axiosRes.data;

    return data;
  } catch (error: unknown) {
    raiseApiError(error, 'An error occured', true);
  }
};

export const getUserById = async (id: string): Promise<UserProfileResponse> => {
  try {
    const api = Api();

    const axiosRes = await api.get(`/users/profile/${id}`);
    const data = axiosRes.data;

    return data;
  } catch (error: unknown) {
    raiseApiError(error, 'An error occured', true);
  }
};

export const getUserProfilePictureUrl = async (userId: string): Promise<string | null> => {
  try {
    const api = Api();
    const axiosRes = await api.get<UserDocumentsMetadataResponse>(`/users/documents/${userId}`, {
      params: {
        document_type: 'profile_picture',
        document_status: 'active',
      },
    });

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

export const getAllEstateUsers = async (page: number = 1, limit: number = 5): Promise<AllUsers> => {
  try {
    const api = Api();

    const axiosRes = await api.get('/users/all', {
      params: { page, limit, status: 'all' },
    });
    const data = axiosRes.data;

    return data;
  } catch (error: unknown) {
    raiseApiError(error, 'An error occured', true);
  }
};

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
    await api.post(`/users/${user_id}/resend-verification`);
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
