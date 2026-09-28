import { type Dispatch, type SetStateAction } from 'react';
import { UserRolesType } from './general';

export type AuthContextType = {
  isReady: boolean;
  resetKey: number;
  signIn: (userData: any) => Promise<void>;
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
};

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
