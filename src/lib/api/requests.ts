import Api from '.';
import { getErrorMessage } from '../helpers';

export const approveRequests = async (ids: string[]): Promise<boolean> => {
	try {
		const api = Api();
		const axiosRes = await api.get(`/users/guest`);
		const data = axiosRes.data;

		return data;
	} catch (error: any) {
		throw new Error(`${getErrorMessage(error) || 'An error occured'} `);
	}
};

export const declineRequests = async (ids: string[]): Promise<boolean> => {
	try {
		const api = Api();
		const axiosRes = await api.get(`/users/guest`);
		const data = axiosRes.data;

		return data;
	} catch (error: any) {
		throw new Error(`${getErrorMessage(error) || 'An error occured'} `);
	}
};
