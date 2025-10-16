export type AuthContextType = {
	isReady: boolean;
	signIn: (userData: any) => Promise<void>;
	signOut: () => Promise<void>;
};

export type LoginResponse = {
	access_token: string;
	role: 'resident' | 'primary_admin' | 'admin' | 'security';
};
