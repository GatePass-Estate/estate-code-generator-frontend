import Api from '.';
import { getErrorMessage } from '../helpers';
import { AllUsers, UpdatePasswordPayload, User } from '@/src/types/user';

export const updatepassword = async (payload: { user_id: string; current_password: string; new_password: string }): Promise<UpdatePasswordPayload> => {
	try {
		const api = Api();

		const axiosRes = await api.post(`/users/password/update`, {
			user_id: payload.user_id,
			current_password: payload.current_password,
			new_password: payload.new_password,
		});

		const data = axiosRes.data;

		return data;
	} catch (error: any) {
		throw new Error(`${getErrorMessage(error) || 'An error occured'} `);
	}
};

export const getUserByIdAdmin = async (id: string): Promise<User> => {
	try {
		const api = Api();

		const axiosRes = await api.get(`/users/${id}`);
		const data = axiosRes.data;

		return data;
	} catch (error: any) {
		throw new Error(`${getErrorMessage(error) || 'An error occured'} `);
	}
};

export const getUserByIdSecurity = async (id: string): Promise<User> => {
	try {
		const api = Api();

		const axiosRes = await api.get(`/users/profile/${id}`);
		const data = axiosRes.data;

		return data;
	} catch (error: any) {
		throw new Error(`${getErrorMessage(error) || 'An error occured'} `);
	}
};

export const getAllUsers = async (): Promise<AllUsers> => {
	try {
		const api = Api();

		const axiosRes = await api.get(`/users/profile/users`);
		const data = axiosRes.data;

		return data;
	} catch (error: any) {
		throw new Error(`${getErrorMessage(error) || 'An error occured'} `);
	}
};
