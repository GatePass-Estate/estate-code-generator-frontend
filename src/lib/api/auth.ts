import Api from '.';
import axios from 'axios';
import { LoginResponse, VerifyEmailActivationResponse } from '@/src/types/auth';
import { getErrorMessage } from '../helpers';
import { useQuery } from '@tanstack/react-query';

const queryKeys = {
  verifyEmailActivationToken: (token: string) => ['verify-email-activation-token', token],
};

export async function loginUser(email: string, password: string): Promise<LoginResponse> {
	try {
		const api = Api();
		const axiosRes = await api.post(`/auth/login`, { email, password });
		const data = axiosRes.data;

		if (data?.requires_tos_acceptance && data?.access_token) {
			return data;
		}

		return data;
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

export async function forgotPassword(email: string): Promise<{ message: string }> {
	try {
		const api = Api();
		const axiosRes = await api.post(`/auth/forgot-password`, { email });
		return axiosRes.data;
	} catch (error: any) {
		throw new Error(`${getErrorMessage(error) || 'Failed to send password reset email'} `);
	}
}

export async function verifyPasswordReset(token: string): Promise<{ user_id: string; email: string; must_change_password: boolean }> {
	try {
		const api = Api();
		const axiosRes = await api.get(`/users/verify/password-reset?token=${token}`);
		return axiosRes.data;
	} catch (error: any) {
		throw new Error(`${getErrorMessage(error) || 'Invalid or expired reset link'} `);
	}
}

export async function resetPassword(user_id: string, new_password: string): Promise<{ message: string }> {
	try {
		const api = Api();
		const axiosRes = await api.post(`/users/password/reset`, { user_id, new_password });
		return axiosRes.data;
	} catch (error: any) {
		throw new Error(`${getErrorMessage(error) || 'Failed to reset password'} `);
	}
}
