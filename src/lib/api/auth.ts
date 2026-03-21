import Api from '.';
import { LoginResponse, VerifyEmailActivationResponse } from '@/src/types/auth';
import { getErrorMessage } from '../helpers';
import { useQuery } from '@tanstack/react-query';

const queryKeys = {
  verifyEmailActivationToken: (token: string) => ['verify-email-activation-token', token],
};

export async function loginUser(email: string, password: string): Promise<LoginResponse> {
	try {
		console.log('Logging in user with email:', email);
		const api = Api();
		const axiosRes = await api.post(`/auth/login`, { email, password });
		const data = axiosRes.data;

		return data;
	} catch (error: any) {
		throw new Error(`${getErrorMessage(error) || 'Login failed'} `);
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


async function verifyEmailActivationToken(token: string): Promise<VerifyEmailActivationResponse> {
	try {
		const api = Api('user');
		const response = await api.get<VerifyEmailActivationResponse>(`/users/verify/email`, {
			params: { token },
		});
		return response.data;
	} catch (error: any) {
		throw new Error(`${getErrorMessage(error) || 'An error occurred'}`);
	}
}

export function useVerifyEmailActivationToken(token: string) {
  return useQuery({
    queryKey: queryKeys.verifyEmailActivationToken(token),
    queryFn: () => verifyEmailActivationToken(token),
    enabled: !!token, // only run if token exists
  });
}
