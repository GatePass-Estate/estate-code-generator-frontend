import Api from '.';
import { getErrorMessage } from '../helpers';
import { AllUsers, RegisterUserPayload, UpdatePasswordPayload, User } from '@/src/types/user';

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

export const getUserById = async (id: string): Promise<User> => {
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

		const axiosRes = await api.get(`/users/all?status=all`);
		const data = axiosRes.data;

		return data;
	} catch (error: any) {
		throw new Error(`${getErrorMessage(error) || 'An error occured'} `);
	}
};

export const registerUser = async (payload: RegisterUserPayload): Promise<User> => {
	try {
		const api = Api();

		const axiosRes = await api.post(`/users/register`, payload);
		const data = axiosRes.data;

		return data;
	} catch (error: any) {
		throw new Error(`${getErrorMessage(error) || 'An error occured'} `);
	}
};

export const activateUser = async (payload: { user_id: string; new_password: string }): Promise<User> => {
	try {
		const api = Api();

		const axiosRes = await api.post(`/users/validate/account`, payload);
		const data = axiosRes.data;

		return data;
	} catch (error: any) {
		throw new Error(`${getErrorMessage(error) || 'An error occured'} `);
	}
};
