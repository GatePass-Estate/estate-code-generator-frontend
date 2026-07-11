import Api from '.';
import axios, { isAxiosError } from 'axios';
import { LoginResponse, VerifyEmailActivationResponse } from '@/src/types/auth';
import { getErrorMessage } from '../helpers';
import { useQuery } from '@tanstack/react-query';

const queryKeys = {
  verifyEmailActivationToken: (token: string) => ['verify-email-activation-token', token],
};

const DEFAULT_LOGIN_ESTATE_ID = 'e7fb4d3b-6418-4729-9454-d34c7f069968';

export async function loginUser(
  email: string,
  password: string,
  estate_id?: string | null
): Promise<LoginResponse> {
  try {
    const api = Api();
    const axiosRes = await api.post(`/auth/login`, {
      email,
      password,
      estate_id: estate_id || DEFAULT_LOGIN_ESTATE_ID,
    });
    const data = axiosRes.data;

    if (data?.requires_tos_acceptance && data?.access_token) {
      return data;
    }

    return data;
  } catch (error: any) {
    if (
      isAxiosError(error) &&
      error.response?.data?.requires_tos_acceptance &&
      error.response?.data?.access_token
    ) {
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
      }
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

export async function enableBiometricLogin(
  accessToken: string,
  estate_id?: string | null
): Promise<{ biometric_token: string }> {
  try {
    const baseUrl = process.env.EXPO_PUBLIC_USER_SERVICE_API_URL;
    const axiosRes = await axios.post(
      `${baseUrl}/api/v1/auth/biometric/enable`,
      estate_id ? { estate_id } : {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    return axiosRes.data;
  } catch (error: any) {
    throw new Error(`${getErrorMessage(error) || 'Unable to enable biometric login'} `);
  }
}

export async function loginBiometric(
  biometricToken: string,
  estate_id: string,
  accessToken?: string
): Promise<{
  success: boolean;
  access_token: string | null;
  role?: string | null;
  token_type?: string;
  session_id?: string | null;
  biometric_token?: string | null;
  requires_full_reauth?: boolean;
}> {
  try {
    const baseUrl = process.env.EXPO_PUBLIC_USER_SERVICE_API_URL;
    const axiosRes = await axios.post(
      `${baseUrl}/api/v1/auth/biometric/login`,
      { biometric_token: biometricToken, estate_id },
      {
        headers: {
          Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    return axiosRes.data;
  } catch (error: any) {
    throw new Error(`${getErrorMessage(error) || 'Biometric login failed'} `);
  }
}

export async function disableBiometricLogin(accessToken: string): Promise<{ message?: string }> {
  try {
    const baseUrl = process.env.EXPO_PUBLIC_USER_SERVICE_API_URL;
    const axiosRes = await axios.delete(`${baseUrl}/api/v1/auth/biometric`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    return axiosRes.data;
  } catch (error: any) {
    throw new Error(`${getErrorMessage(error) || 'Unable to disable biometric login'} `);
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

export async function forgotPassword(
  email: string,
  estate_id?: string | null
): Promise<{ message: string }> {
  try {
    const api = Api();
    const axiosRes = await api.post(`/auth/forgot-password`, {
      email,
      ...(estate_id ? { estate_id } : {}),
    });
    return axiosRes.data;
  } catch (error: any) {
    throw new Error(`${getErrorMessage(error) || 'Failed to send password reset email'} `);
  }
}

export async function verifyPasswordReset(
  token: string
): Promise<{ user_id: string; email: string; must_change_password: boolean }> {
  try {
    const api = Api();
    const axiosRes = await api.get(`/users/verify/password-reset?token=${token}`);
    return axiosRes.data;
  } catch (error: any) {
    throw new Error(`${getErrorMessage(error) || 'Invalid or expired reset link'} `);
  }
}

export async function resetPassword(
  user_id: string,
  new_password: string
): Promise<{ message: string }> {
  try {
    const api = Api();
    const axiosRes = await api.post(`/users/password/reset`, { user_id, new_password });
    return axiosRes.data;
  } catch (error: any) {
    throw new Error(`${getErrorMessage(error) || 'Failed to reset password'} `);
  }
}
