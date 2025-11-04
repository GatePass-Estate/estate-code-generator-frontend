import { fetchMe } from '@/src/lib/api/auth';
import { getAuthState } from '@/src/lib/helpers';
import { useAuthStore } from '@/src/lib/stores/authStore';
import { useUserStore } from '@/src/lib/stores/userStore';
import { AuthContextType } from '@/src/types/auth';
import { User } from '@/src/types/user';
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
		router.replace({
			pathname: '/auth/login',
			params: {
				loggedOut: 'true',
			},
		});
	};

	useEffect(() => {
		const loadAuthState = async () => {
			const localData = await getAuthState();

			if (localData?.access_token) {
				useAuthStore.setState({ access_token: localData.access_token, role: localData.role });
			}

			try {
				const myProfile = (await fetchMe(localData?.access_token || '')) as User;

				if (myProfile && myProfile.status) {
					await signIn(myProfile);
					if (myProfile.role === 'security') {
						router.replace('/security');
					} else {
						router.replace('/user');
					}
				} else {
					router.replace('/auth/login');
				}
			} catch (error) {
				router.replace('/auth/login');
				console.log('Error loading auth state', error);
			} finally {
				setIsReady(true);
				await SplashScreen.hideAsync();
			}
		};

		loadAuthState();

		router.prefetch('/auth/login');
	}, []);

	return <AuthContext.Provider value={{ isReady, signIn, signOut, setIsReady }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	return useContext(AuthContext);
}
