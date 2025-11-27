import { CreateGuestApiResponse, DeleteGuestResponse, Guest, GuestApiResponse } from '@/src/types/guests';
import Api from '.';
import { getErrorMessage } from '../helpers';
import { GenderType, RelationshipType } from '@/src/types/general';

export const getMyGuests = async (): Promise<GuestApiResponse> => {
	try {
		const api = Api();
		const axiosRes = await api.get(`/users/guest`);
		const data = axiosRes.data;

		return data;
	} catch (error: any) {
		throw new Error(`${getErrorMessage(error) || 'An error occured'} `);
	}
};

export const deleteMyGuest = async (id: string): Promise<DeleteGuestResponse> => {
	try {
		const api = Api();

		const axiosRes = await api.delete(`/users/guest/${id}`);
		const data = axiosRes.data;

		return data;
	} catch (error: any) {
		throw new Error(`${getErrorMessage(error) || 'An error occured'} `);
	}
};

export const getSingleGuest = async (id: string): Promise<Guest> => {
	try {
		const api = Api();

		const axiosRes = await api.get(`/users/guest/${id}`);
		const data = axiosRes.data;

		return data;
	} catch (error: any) {
		throw new Error(`${getErrorMessage(error) || 'An error occured'} `);
	}
};

export const createGuest = async (payload: { resident_id: string; guest_name: string; gender: GenderType; relationship: RelationshipType }): Promise<CreateGuestApiResponse> => {
	try {
		const api = Api();

		const axiosRes = await api.post(`/users/guest/register`, payload);
		const data = axiosRes.data;

		return data;
	} catch (error: any) {
		throw new Error(`${getErrorMessage(error) || 'An error occured'} `);
	}
};
