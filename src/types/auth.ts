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
  access_token: string;
  role: UserRolesType;
  requires_tos_acceptance?: boolean;
  requires_2fa?: boolean;
  two_fa_token?: string | null;
  token_type?: string;
  success?: boolean;
  plan?: string | null;
  subscription_plan?: string | null;
  tier?: string | null;
  plan_name?: string | null;
};

export type VerifyEmailActivationResponse = {
  user_id: string;
  email: string;
  must_change_password: boolean;
};
