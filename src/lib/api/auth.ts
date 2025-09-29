import Api from '.';
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

export async function fetchMe(token: string) {
	try {
		const axiosRes = await api.get(`/users/profile/me`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
		const data = axiosRes.data;

		return data;
	} catch (error: any) {
		throw new Error(`${getErrorMessage(error) || 'An error occured'} `);
	}
}
