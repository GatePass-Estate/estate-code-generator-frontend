import { Platform } from 'react-native';
import { fetchMe } from '@/src/lib/api/auth';
import {
  broadcastLogout,
  clearAccessToken,
  clearAuthState,
  getAuthState,
  getSelectedInstitution,
  initAuthSync,
} from '@/src/lib/helpers';
import { deleteBiometricToken } from '@/src/lib/biometricAuth';
import { useAuthStore } from '@/src/lib/stores/authStore';
import { useUserStore } from '@/src/lib/stores/userStore';
import { AuthContextType } from '@/src/types/auth';
import { User } from '@/src/types/user';
import { SplashScreen, usePathname, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { UserRolesType } from '../types/general';

SplashScreen.preventAutoHideAsync();

const AuthContext = createContext<AuthContextType>({
  isReady: false,
  resetKey: 0,
  signIn: async () => {},
  signOut: async () => {},
});

const PUBLIC_AUTH_ROUTES = [
  '/activate',
  '/auth/set-password',
  '/auth/email-activation-status',
  '/auth/institution',
  '/auth/login',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/tos',
  '/auth/data-protection-policy',
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  const isProcessingRef = useRef(false);

  const handleCrossTabLogout = useCallback(async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    try {
      useUserStore.getState().clearUser();
      useAuthStore.getState().clearAuth();
      router.replace('/auth/institution');
    } finally {
      isProcessingRef.current = false;
    }
  }, [router]);

  const performSignOut = useCallback(async () => {
    setIsReady(false);
    useUserStore.getState().clearUser();
    useAuthStore.getState().clearAuth();
    await clearAuthState();
    try {
      await deleteBiometricToken();
    } catch (e) {
      console.log('Error clearing biometric token during sign out', e);
    }
    broadcastLogout();
    // Force full component reset by incrementing key
    setResetKey((prev) => prev + 1);
    router.replace('/auth/institution');
  }, [router]);

  const signIn = async (userData: User) => {
    useUserStore.setState({ ...userData });
    setIsReady(true);
  };

  const signOut = async () => {
    await performSignOut();
  };

  const handleCrossTabLogin = useCallback(
    async (token: string, role: UserRolesType) => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      try {
        useAuthStore.setState({ access_token: token, role });

        const myProfile = (await fetchMe(token)) as User;

        if (myProfile && myProfile.status) {
          useUserStore.setState({ ...myProfile });

          if (['primary_admin', 'admin', 'resident'].includes(myProfile.role!)) {
            router.replace('/user');
          } else if (myProfile.role === 'security') {
            router.replace('/security');
          }
        }
      } catch (error) {
        console.log('Error syncing auth from another tab', error);
        await performSignOut();
      } finally {
        isProcessingRef.current = false;
      }
    },
    [router, performSignOut]
  );

  const hasLoadedAuth = useRef(false);

  useEffect(() => {
    let cleanupSync: (() => void) | undefined;

    const isPublicRoute = (currentPath: string, initialURL: string | null) => {
      return PUBLIC_AUTH_ROUTES.some(
        (r) =>
          currentPath === r || currentPath.startsWith(r) || (initialURL && initialURL.includes(r))
      );
    };

    const loadAuthState = async () => {
      if (hasLoadedAuth.current) return;
      hasLoadedAuth.current = true;

      const initialURL = await Linking.getInitialURL();
      const currentPath =
        Platform.OS === 'web'
          ? typeof window !== 'undefined'
            ? window.location?.pathname || ''
            : pathname || ''
          : pathname;
      const localData = await getAuthState();

      // Always require explicit login or biometric unlock on app start.
      // Do not auto-sign in from a token left in storage.
      if (localData?.access_token) {
        await clearAccessToken();
        useAuthStore.getState().clearAuth();
        useUserStore.getState().clearUser();
      }

      if (!isPublicRoute(currentPath, initialURL)) {
        const institution = await getSelectedInstitution();
        router.replace(institution ? '/auth/login' : '/auth/institution');
      }

      setIsReady(true);
      await SplashScreen.hideAsync();
    };

    loadAuthState();

    cleanupSync = initAuthSync({
      onLogin: handleCrossTabLogin,
      onLogout: handleCrossTabLogout,
    });

    return () => {
      cleanupSync?.();
    };
  }, [handleCrossTabLogin, handleCrossTabLogout, router, pathname]);

  return (
    <AuthContext.Provider value={{ isReady, resetKey, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
