import Api from '.';
import axios from 'axios';
import { LoginResponse } from '@/src/types/auth';
import { getErrorMessage } from '../helpers';

export async function loginUser(email: string, password: string): Promise<LoginResponse> {
	try {
		const api = Api();
		const axiosRes = await api.post(`/auth/login`, { email, password });
		return axiosRes.data;
	} catch (error: any) {
		if (axios.isAxiosError(error) && error.response?.data?.requires_tos_acceptance && error.response?.data?.access_token) {
			return error.response.data;
		}
		throw new Error(`${getErrorMessage(error) || 'Login failed'} `);
	}
}

export async function acceptTos(token: string): Promise<LoginResponse> {
	try {
		const baseUrl = process.env.EXPO_PUBLIC_USER_SERVICE_API_URL;
		const axiosRes = await axios.post(
			`${baseUrl}/api/v1/auth/accept-tos`,
			{ tos_token: token },
			{
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				timeout: 10000,
			},
		);
		return axiosRes.data;
	} catch (error: any) {
		throw new Error(`${getErrorMessage(error) || 'Failed to accept Terms of Service'} `);
	}
}

export async function fetchMe(token: string) {
	try {
		const api = Api();
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
