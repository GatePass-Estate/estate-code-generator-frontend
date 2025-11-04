import { UserRolesType } from './general';

export type AuthContextType = {
	isReady: boolean;
	signIn: (userData: any) => Promise<void>;
	signOut: () => Promise<void>;
};

export type LoginResponse = {
	access_token: string;
	role: UserRolesType;
};
