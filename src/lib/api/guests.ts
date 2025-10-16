import { CreateGuestApiResponse, DeleteGuestResponse, Guest, GuestApiResponse } from '@/src/types/guests';
import Api from '.';

const api = Api();

export const getMyGuests = async (): Promise<GuestApiResponse> => {
	try {
		const axiosRes = await api.get(`/users/guest`);

		const ok = axiosRes.status >= 200 && axiosRes.status < 300;
		const data = axiosRes.data;

		if (!ok) throw new Error(data?.detail || data?.message || 'An error occured');

		return data;
	} catch (error: any) {
		throw new Error(`${error?.message || 'An error occured'} `);
	}
};

export const deleteMyGuest = async (id: string): Promise<DeleteGuestResponse> => {
	try {
		const axiosRes = await api.delete(`/users/guest/${id}`);

		const ok = axiosRes.status >= 200 && axiosRes.status < 300;
		const data = axiosRes.data;

		if (!ok) throw new Error(data?.detail || data?.message || 'An error occured');

		return data;
	} catch (error: any) {
		throw new Error(`${error?.message || 'An error occured'} `);
	}
};

export const getSingleGuest = async (id: string): Promise<Guest> => {
	try {
		const axiosRes = await api.get(`/users/guest/${id}`);

		const ok = axiosRes.status >= 200 && axiosRes.status < 300;
		const data = axiosRes.data;

		if (!ok) throw new Error(data?.detail || data?.message || 'An error occured');

		return data;
	} catch (error: any) {
		throw new Error(`${error?.message || 'An error occured'} `);
	}
};

export const createGuest = async (): Promise<CreateGuestApiResponse> => {
	try {
		const axiosRes = await api.post(`/users/guest/register`);

		const ok = axiosRes.status >= 200 && axiosRes.status < 300;
		const data = axiosRes.data;

		if (!ok) throw new Error(data?.detail || data?.message || 'An error occured');

		return data;
	} catch (error: any) {
		throw new Error(`${error?.message || 'An error occured'} `);
	}
};
