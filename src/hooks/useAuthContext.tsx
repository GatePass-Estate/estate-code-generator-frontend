import { Platform } from 'react-native';
import { fetchMe } from '@/src/lib/api/auth';
import {
  broadcastLogout,
  clearAuthState,
  getAuthState,
  getPostAuthRedirectRoute,
  getSelectedInstitution,
  initAuthSync,
} from '@/src/lib/helpers';
import { useAuthStore } from '@/src/lib/stores/authStore';
import { useProfileDocumentsStore } from '@/src/lib/stores/profileDocumentsStore';
import { useUserStore } from '@/src/lib/stores/userStore';
import { AuthContextType } from '@/src/types/auth';
import { User } from '@/src/types/user';
import { usePathname, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { UserRolesType } from '../types/general';

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
      useProfileDocumentsStore.getState().clear();
      useAuthStore.getState().clearAuth();
      const institution = await getSelectedInstitution();
      router.replace(getPostAuthRedirectRoute(institution));
    } finally {
      isProcessingRef.current = false;
    }
  }, [router]);

  const performSignOut = useCallback(async () => {
    setIsReady(false);
    useUserStore.getState().clearUser();
    useProfileDocumentsStore.getState().clear();
    useAuthStore.getState().clearAuth();
    await clearAuthState();
    broadcastLogout();
    // Force full component reset by incrementing key
    setResetKey((prev) => prev + 1);
    const institution = await getSelectedInstitution();
    router.replace(getPostAuthRedirectRoute(institution));
  }, [router]);

  const routeForUser = useCallback(
    (user: User) => {
      if (['primary_admin', 'admin', 'resident'].includes(user.role!)) {
        router.replace('/user');
      } else if (user.role === 'security') {
        router.replace('/security');
      }
    },
    [router]
  );

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
          useAuthStore.setState({ access_token: token, role: myProfile.role });
          setIsReady(true);
          setTimeout(() => {
            routeForUser(myProfile);
          }, 50);
        }
      } catch (error) {
        console.log('Error syncing auth from another tab', error);
        await performSignOut();
      } finally {
        isProcessingRef.current = false;
      }
    },
    [performSignOut, routeForUser]
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

      try {
        const initialURL = await Linking.getInitialURL();
        const currentPath =
          Platform.OS === 'web'
            ? typeof window !== 'undefined'
              ? window.location?.pathname || ''
              : pathname || ''
            : pathname;
        const localData = await getAuthState();

        if (localData?.access_token) {
          useAuthStore.setState({ access_token: localData.access_token, role: localData.role });

          try {
            const myProfile = (await fetchMe(localData.access_token)) as User;

            if (myProfile?.status) {
              useUserStore.setState({ ...myProfile });
              useAuthStore.setState({ access_token: localData.access_token, role: myProfile.role });
              setIsReady(true);
              try {
                setTimeout(() => {
                  routeForUser(myProfile);
                }, 50);
              } catch (navigationError) {
                console.log('Error routing restored auth session', navigationError);
              }
              return;
            }
          } catch (error) {
            console.log('Error restoring auth state on startup', error);
          }
        }

        if (!isPublicRoute(currentPath, initialURL)) {
          const institution = await getSelectedInstitution();
          try {
            router.replace(getPostAuthRedirectRoute(institution));
          } catch (navigationError) {
            console.log('Error redirecting auth bootstrap', navigationError);
          }
        }
      } catch (error) {
        console.log('Error bootstrapping auth state', error);
      } finally {
        setIsReady(true);
      }
    };

    loadAuthState();

    cleanupSync = initAuthSync({
      onLogin: handleCrossTabLogin,
      onLogout: handleCrossTabLogout,
    });

    return () => {
      cleanupSync?.();
    };
  }, [handleCrossTabLogin, handleCrossTabLogout, router, pathname, routeForUser]);

  return (
    <AuthContext.Provider value={{ isReady, resetKey, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
