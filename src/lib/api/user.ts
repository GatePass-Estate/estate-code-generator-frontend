import Api from '.';
import { getErrorMessage } from '../helpers';
import { UpdatePasswordPayload } from '@/src/types/user';

export const updatepassword = async (payload: { user_id: string; current_password: string; new_password: string }): Promise<UpdatePasswordPayload> => {
	try {
		const api = Api();

		const axiosRes = await api.post(`/users/password/update`, {
			user_id: payload.user_id,
			current_password: payload.current_password,
			new_password: payload.new_password,
		});

		const ok = axiosRes.status >= 200 && axiosRes.status < 300;
		const data = axiosRes.data;

		if (!ok) throw new Error(data?.detail || data?.message || 'An error occured');

		return data;
	} catch (error: any) {
		throw new Error(`${getErrorMessage(error) || 'An error occured'} `);
	}
};
