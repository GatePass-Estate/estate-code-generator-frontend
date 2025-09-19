import Api from '../api';
import { useAuthStore } from '../stores/authStore';

export async function loginUser(email: string, password: string) {
	try {
		const api = await Api();
		const axiosRes = await api.post(`/auth/login`, { email, password });

		const ok = axiosRes.status >= 200 && axiosRes.status < 300;
		const data = axiosRes.data;

		if (!ok) {
			console.log(data);
			throw new Error(data?.detail || data?.message || 'Login failed');
		}

		console.log(data);
		return data;
	} catch (error: any) {
		throw new Error(`${error?.message || 'Login failed'} `);
	}
}

export async function fetchMe() {
	try {
		const api = await Api();

		const axiosRes = await api.get(`/users/profile/me`);

		const ok = axiosRes.status >= 200 && axiosRes.status < 300;
		const data = axiosRes.data;

		if (!ok) {
			throw new Error(data?.detail || data?.message || 'An error occured');
		}

		return data;
	} catch (error: any) {
		throw new Error(`${error?.message || 'An error occured'} `);
	}
}
