import { DeleteGuestResponse, Guest, GuestApiResponse } from '@/src/types/guests';
import Api from '.';

const api = Api();

export const getMyGuests = async () => {
	try {
		const axiosRes = await api.get(`/users/guest`);

		const ok = axiosRes.status >= 200 && axiosRes.status < 300;
		const data = axiosRes.data;

		if (!ok) {
			throw new Error(data?.detail || data?.message || 'An error occured');
		}

		return data as GuestApiResponse;
	} catch (error: any) {
		throw new Error(`${error?.message || 'An error occured'} `);
	}
};

export const deleteMyGuest = async (id: string) => {
	try {
		const axiosRes = await api.delete(`/users/guest/${id}`);

		const ok = axiosRes.status >= 200 && axiosRes.status < 300;
		const data = axiosRes.data;

		if (!ok) {
			throw new Error(data?.detail || data?.message || 'An error occured');
		}

		return data as DeleteGuestResponse;
	} catch (error: any) {
		throw new Error(`${error?.message || 'An error occured'} `);
	}
};

export const getSingleGuest = async (id: string) => {
	try {
		const api = await Api();

		const axiosRes = await api.get(`/users/guest/${id}`);

		const ok = axiosRes.status >= 200 && axiosRes.status < 300;
		const data = axiosRes.data;

		if (!ok) {
			throw new Error(data?.detail || data?.message || 'An error occured');
		}

		return data as Guest;
	} catch (error: any) {
		throw new Error(`${error?.message || 'An error occured'} `);
	}
};
