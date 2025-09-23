import { fetchMe } from '@/lib/api/auth';
import { clearAuthState, getAuthState } from '@/lib/helpers';
import { useAuthStore } from '@/lib/stores/authStore';
import { useUserStore } from '@/lib/stores/userStore';
import { AuthContextType } from '@/types/auth';
import { User } from '@/types/user';
import { SplashScreen, useRouter } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';

SplashScreen.preventAutoHideAsync();

const AuthContext = createContext<AuthContextType>({
	isReady: false,
	signIn: async () => {},
	signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [isReady, setIsReady] = useState(false);
	const router = useRouter();

	const signIn = async (userData: User) => {
		useUserStore.setState({ ...userData });
		setIsReady(true);
	};

	const signOut = async () => {
		setIsReady(false);
		useUserStore.getState().clearUser();
		useAuthStore.getState().clearAuth();
		clearAuthState();
		router.replace('/login');
	};

	useEffect(() => {
		const loadAuthState = async () => {
			const localData = await getAuthState();

			console.log('Loaded auth state from storage:', localData);
			if (localData?.access_token) {
				useAuthStore.setState({ access_token: localData.access_token, role: localData.role });
			}

			try {
				const myProfile = (await fetchMe()) as User;
				console.log('Fetched profile:', myProfile);
				if (myProfile && myProfile.status) {
					await signIn(myProfile);
					await SplashScreen.hideAsync();
					router.replace('/(protected)/(tabs)/(home)');
				}
			} catch (error) {
				console.log('Error loading auth state', error);
			} finally {
				setIsReady(true);
			}
		};

		loadAuthState();
	}, []);

	return <AuthContext.Provider value={{ isReady, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	return useContext(AuthContext);
}
