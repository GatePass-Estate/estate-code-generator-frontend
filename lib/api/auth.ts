import Api from './';
import { getErrorMessage } from '../helpers';

const api = Api();

export async function loginUser(email: string, password: string) {
	try {
		const axiosRes = await api.post(`/auth/login`, { email, password });
		const data = axiosRes.data;

		return data;
	} catch (error: any) {
		throw new Error(`${getErrorMessage(error) || 'Login failed'} `);
	}
}

export async function fetchMe() {
	try {
		const axiosRes = await api.get(`/users/profile/me`);
		const data = axiosRes.data;

		return data;
	} catch (error: any) {
		throw new Error(`${getErrorMessage(error) || 'An error occured'} `);
	}
}
