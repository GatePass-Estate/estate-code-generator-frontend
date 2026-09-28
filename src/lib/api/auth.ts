import Api from '.';
import axios, { isAxiosError } from 'axios';
import {
  LoginResponse,
  SessionListResponse,
  TwoFARecoveryCodesResponse,
  TwoFASetupResponse,
  VerifyEmailActivationResponse,
} from '@/src/types/auth';
import { getErrorMessage } from '../helpers';
import { useQuery } from '@tanstack/react-query';

const queryKeys = {
  verifyEmailActivationToken: (token: string) => ['verify-email-activation-token', token],
};

export async function loginUser(
  email: string,
  password: string,
  estate_id?: string | null
): Promise<LoginResponse> {
  if (!estate_id) {
    throw new Error('Please select your institution before logging in.');
  }

  try {
    const api = Api();
    const axiosRes = await api.post(`/auth/login`, {
      email,
      password,
      ...(estate_id ? { estate_id } : {}),
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
    return axiosRes.data;
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

/* ------------------------------------------------------------------ */
/* Two-factor authentication                                           */
/* ------------------------------------------------------------------ */

/** Backend detail strings the 2FA flow branches on. */
export const TWO_FA_NOT_ENABLED = '2fa is not enabled';
export const TWO_FA_ALREADY_ENABLED = '2fa is already enabled';

export function isTwoFactorNotEnabledError(message?: string | null): boolean {
  return !!message && message.toLowerCase().includes(TWO_FA_NOT_ENABLED);
}

export function isTwoFactorAlreadyEnabledError(message?: string | null): boolean {
  return !!message && message.toLowerCase().includes(TWO_FA_ALREADY_ENABLED);
}

/**
 * Asks the server whether TOTP is currently enabled for the signed-in user.
 * Returns null when it cannot tell (offline, unexpected response).
 *
 * Order of authority:
 *  1. `totp_enabled` on `/users/profile/me`, once the backend exposes it.
 *  2. A read-only probe of `DELETE /auth/2fa/disable` with a non-numeric code.
 *     The backend checks `totp_enabled` *before* verifying the code, so it
 *     answers 400 "2FA is not enabled." when off and 401 "Invalid TOTP code."
 *     when on. A non-numeric code can never match a TOTP, so this cannot
 *     accidentally disable anything. Remove this branch once (1) is deployed.
 *
 * This replaces reading state from cached flags / session metadata, which
 * drifted from the server and showed 2FA as on after it had been turned off.
 */
export async function getTwoFactorStatus(): Promise<boolean | null> {
  const api = Api();

  try {
    const profile = await api.get(`/users/profile/me`);
    const flag = profile.data?.totp_enabled;
    if (typeof flag === 'boolean') return flag;
  } catch {
    // Fall through to the probe.
  }

  try {
    await api.delete(`/auth/2fa/disable`, { data: { code: 'status-probe' } });
    // A 2xx here would be unexpected; do not guess.
    return null;
  } catch (error: any) {
    if (!isAxiosError(error)) return null;
    const status = error.response?.status;
    const detail = String(error.response?.data?.detail ?? '');
    if (status === 400 && isTwoFactorNotEnabledError(detail)) return false;
    if (status === 401 && /invalid totp code/i.test(detail)) return true;
    return null;
  }
}

/** Starts TOTP enrolment. Returns the provisioning URI to render as a QR code. */
export async function setupTwoFactor(): Promise<TwoFASetupResponse> {
  try {
    const api = Api();
    const axiosRes = await api.post(`/auth/2fa/setup`);
    return axiosRes.data;
  } catch (error: any) {
    throw new Error(`${getErrorMessage(error) || 'Could not start two-factor setup'}`);
  }
}

/** Confirms enrolment with a code from the authenticator app. Returns recovery codes. */
export async function enableTwoFactor(code: string): Promise<TwoFARecoveryCodesResponse> {
  try {
    const api = Api();
    const axiosRes = await api.post(`/auth/2fa/enable`, { code });
    return axiosRes.data;
  } catch (error: any) {
    throw new Error(`${getErrorMessage(error) || 'Could not enable two-factor authentication'}`);
  }
}

/** Turns TOTP off. Requires a current code, so it is sent as a DELETE body. */
export async function disableTwoFactor(code: string): Promise<{ success?: boolean }> {
  try {
    const api = Api();
    const axiosRes = await api.delete(`/auth/2fa/disable`, { data: { code } });
    return axiosRes.data;
  } catch (error: any) {
    throw new Error(`${getErrorMessage(error) || 'Could not disable two-factor authentication'}`);
  }
}

/** Issues a fresh set of recovery codes, invalidating the previous set. */
export async function regenerateRecoveryCodes(code: string): Promise<TwoFARecoveryCodesResponse> {
  try {
    const api = Api();
    const axiosRes = await api.post(`/auth/2fa/regenerate-codes`, { code });
    return axiosRes.data;
  } catch (error: any) {
    throw new Error(`${getErrorMessage(error) || 'Could not regenerate recovery codes'}`);
  }
}

/**
 * Completes a pending 2FA login challenge.
 *
 * Runs before an access token exists, so it deliberately bypasses the shared
 * Api() client (which would attach a stale/empty Authorization header).
 */
export async function verifyTwoFactor(two_fa_token: string, code: string): Promise<LoginResponse> {
  try {
    const baseUrl = process.env.EXPO_PUBLIC_USER_SERVICE_API_URL;
    const axiosRes = await axios.post(
      `${baseUrl}/api/v1/auth/2fa/verify`,
      { two_fa_token, code },
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
    );
    return axiosRes.data;
  } catch (error: any) {
    throw new Error(`${getErrorMessage(error) || 'Invalid authentication code'}`);
  }
}

/** Completes a pending 2FA login with a one-time recovery code. Disables 2FA. */
export async function recoverTwoFactor(
  two_fa_token: string,
  recovery_code: string
): Promise<LoginResponse> {
  try {
    const baseUrl = process.env.EXPO_PUBLIC_USER_SERVICE_API_URL;
    const axiosRes = await axios.post(
      `${baseUrl}/api/v1/auth/2fa/recover`,
      { two_fa_token, recovery_code },
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
    );
    return axiosRes.data;
  } catch (error: any) {
    throw new Error(`${getErrorMessage(error) || 'Invalid recovery code'}`);
  }
}

/* ------------------------------------------------------------------ */
/* Sessions (linked devices)                                           */
/* ------------------------------------------------------------------ */

export async function listSessions(): Promise<SessionListResponse> {
  try {
    const api = Api();
    const axiosRes = await api.get(`/auth/sessions`);
    return axiosRes.data;
  } catch (error: any) {
    throw new Error(`${getErrorMessage(error) || 'Could not load your devices'}`);
  }
}

/** Revokes a single session, signing that device out. */
export async function revokeSession(session_id: string): Promise<{ success?: boolean }> {
  try {
    const api = Api();
    const axiosRes = await api.delete(`/auth/sessions/${session_id}`);
    return axiosRes.data;
  } catch (error: any) {
    throw new Error(`${getErrorMessage(error) || 'Could not log that device out'}`);
  }
}

/** Revokes every session for the current user, including this one. */
export async function revokeAllSessions(): Promise<{ success?: boolean }> {
  try {
    const api = Api();
    const axiosRes = await api.delete(`/auth/sessions`);
    return axiosRes.data;
  } catch (error: any) {
    throw new Error(`${getErrorMessage(error) || 'Could not log out of all devices'}`);
  }
}
