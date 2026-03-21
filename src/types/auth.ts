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
};

export type VerifyEmailActivationResponse = {
	user_id: string;
	email: string;
	must_change_password: boolean;
};
