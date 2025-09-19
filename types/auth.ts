export type AuthContextType = {
	isReady: boolean;
	signIn: (userData: any) => Promise<void>;
	signOut: () => Promise<void>;
};
