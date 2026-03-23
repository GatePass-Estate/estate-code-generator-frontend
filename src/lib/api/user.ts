import Api from '.';
import { getErrorMessage } from '../helpers';
import { AllUsers, RegisterUserPayload, UpdatePasswordPayload, UpdateUserRoleResponse, User } from '@/src/types/user';

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

export const getAllEstateUsers = async (page: number = 1, limit: number = 5): Promise<AllUsers> => {
	try {
		const api = Api();

		const axiosRes = await api.get(`/users/?page=${page}&limit=${limit}`);
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

export const promoteToAdmin = async (user_id: string): Promise<UpdateUserRoleResponse> => {
	try {
		const api = Api();

		const axiosRes = await api.post(`/admins/promote?user_id=${user_id}`);
		const data = axiosRes.data;

		return data;
	} catch (error: any) {
		throw new Error(`${getErrorMessage(error) || 'An error occured'} `);
	}
};
export const demoteToResident = async (user_id: string): Promise<UpdateUserRoleResponse> => {
	try {
		const api = Api();

		const axiosRes = await api.post(`/admins/demote?user_id=${user_id}`);
		const data = axiosRes.data;

		return data;
	} catch (error: any) {
		throw new Error(`${getErrorMessage(error) || 'An error occured'} `);
	}
};

export const resendEmailVerification = async (user_id: string): Promise<any> => {
	try {
		const api = Api();
		const axiosRes = await api.post(`/users/${user_id}/resend-verification`);
		return axiosRes.data;
	} catch (error: any) {
		throw new Error(`${getErrorMessage(error) || 'An error occured'} `);
	}
};

export const deleteUser = async (user_id: string): Promise<any> => {
	try {
		const api = Api();
		const axiosRes = await api.delete(`/users/${user_id}`);
		return axiosRes.data;
	} catch (error: any) {
		throw new Error(`${getErrorMessage(error) || 'An error occured'} `);
	}
};
