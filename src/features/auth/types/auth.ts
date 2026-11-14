import { type Dispatch, type SetStateAction } from 'react';
import { UserRolesType } from '@/src/shared/types/general';
import type { User } from '@/src/features/users/types/user';

export type AuthContextType = {
  isReady: boolean;
  resetKey: number;
  signIn: (userData: User) => Promise<void>;
  signOut: () => Promise<void>;
  setIsReady?: Dispatch<SetStateAction<boolean>>;
};

export type LoginResponse = {
  /** Null while a 2FA challenge is pending — read `requires_2fa` before using it. */
  access_token: string;
  role: UserRolesType;
  requires_tos_acceptance?: boolean;
  requires_2fa?: boolean;
  two_fa_token?: string | null;
  token_type?: string;
  success?: boolean;
  /** Session created for this sign-in; used to mark "this device" in Linked Devices. */
  session_id?: string | null;
  /** Rotating refresh JWT (see src/lib/authRefresh.ts). Absent on 2FA/ToS-pending responses. */
  refresh_token?: string | null;
  /**
   * Trusted-device token for this install. Present after a new-device login, ToS
   * acceptance, 2FA verify, or 2FA recover. Persist when set; keep the old value when null.
   */
  device_token?: string | null;
};

/** POST /auth/biometric/login — same session fields as login, plus optional token rotation. */
export type BiometricLoginResponse = {
  success: boolean;
  access_token: string | null;
  role?: string | null;
  token_type?: string;
  session_id?: string | null;
  refresh_token?: string | null;
  biometric_token?: string | null;
  requires_full_reauth?: boolean;
  /** Fresh trust token when the prior one was missing or expired. */
  device_token?: string | null;
};

export type VerifyEmailActivationResponse = {
  user_id: string;
  email: string;
  must_change_password: boolean;
};

export type TwoFASetupResponse = {
  provisioning_uri: string;
  secret: string;
};

export type TwoFARecoveryCodesResponse = {
  recovery_codes: string[];
  /**
   * Enabling 2FA revokes prior device tokens; when present, overwrite the stored
   * trust token with this fresh one.
   */
  device_token?: string | null;
};

/** Alias for the enable-2FA response shape (recovery codes + optional device token). */
export type TwoFAEnableResponse = TwoFARecoveryCodesResponse;

export type SessionResponse = {
  id: string;
  device_name: string | null;
  ip_address: string | null;
  last_active_at: string;
  expires_at: string;
  is_2fa_verified: boolean;
  created_at: string;
};

export type SessionListResponse = {
  items: SessionResponse[];
  total: number;
};
