import Api from '@/src/shared/services/api/client';
import { toApiError } from '@/src/shared/services/api/errors';
import {
  CreateGuestApiResponse,
  DeleteGuestResponse,
  Guest,
  GuestApiResponse,
} from '@/src/features/visitors/types/guests';
import { GenderType, RelationshipType } from '@/src/shared/types/general';

export const getMyGuests = async (
  page: number = 1,
  limit: number = 6
): Promise<GuestApiResponse> => {
  try {
    const api = Api();
    const axiosRes = await api.get(`/users/guest?page=${page}&limit=${limit}`);
    return axiosRes.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const deleteMyGuest = async (id: string): Promise<DeleteGuestResponse> => {
  try {
    const api = Api();
    const axiosRes = await api.delete(`/users/guest/${id}`);
    return axiosRes.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const getSingleGuest = async (id: string): Promise<Guest> => {
  try {
    const api = Api();
    const axiosRes = await api.get(`/users/guest/${id}`);
    return axiosRes.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const createGuest = async (payload: {
  resident_id: string;
  guest_name: string;
  gender: GenderType;
  relationship: RelationshipType;
}): Promise<CreateGuestApiResponse> => {
  try {
    const api = Api();
    const axiosRes = await api.post(`/users/guest/register`, payload);
    return axiosRes.data;
  } catch (error) {
    throw toApiError(error);
  }
};
