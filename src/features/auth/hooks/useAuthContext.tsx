import { AppState, Platform } from 'react-native';
import { fetchMe } from '@/src/features/auth/services/auth';
import { prefetchEstateEntitlements } from '@/src/features/billing/services/entitlements';
import { clearQueryCache } from '@/src/shared/services/api/queryClient';
import { clearCheckoutAttempts } from '@/src/features/billing/utils/checkoutAttempts';
import {
  broadcastLogout,
  clearAuthState,
  getAuthState,
  getPostAuthRedirectRoute,
  getSelectedInstitution,
  initAuthSync,
} from '@/src/features/auth/services/authPersistence';
import { setUnauthorizedHandler } from '@/src/features/auth/services/session';
import type { SignOutReason } from '@/src/features/auth/services/signOutReason';
import {
  adoptStoredSession,
  getValidAccessToken,
  revokeCurrentSession,
} from '@/src/features/auth/services/authRefresh';
import { useAuthStore } from '@/src/features/auth/store/authStore';
import { useProfileDocumentsStore } from '@/src/features/profile/store/profileDocumentsStore';
import { useUserStore } from '@/src/store/userStore';
import {
  useContactAdminNoticeStore,
  useUpgradePromptStore,
} from '@/src/features/billing/hooks/usePlan';
import { resetBroadcastPopupSuppression } from '@/src/features/notifications/components/BroadcastPopupHost';
import { useNotificationStore } from '@/src/features/notifications/store/notificationStore';
import { unregisterForPushNotifications } from '@/src/features/notifications/services/pushNotifications';
import { AuthContextType } from '@/src/features/auth/types/auth';
import { User } from '@/src/features/users/types/user';
import { usePathname, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { UserRolesType } from '@/src/shared/types/general';

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
  '/auth/two-factor',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/tos',
  '/auth/data-protection-policy',
  // Paystack's return page after checkout (opened outside the signed-in app).
  '/payment/callback',
];

/** Prefetch documents, profile photo and plan entitlements without blocking navigation. */
function prefetchUserData(user: User) {
  prefetchEstateEntitlements(user.estate_id);

  const userId = user.user_id || user.id;
  if (userId) void useProfileDocumentsStore.getState().syncDocuments(userId);
}

async function clearUserData() {
  useUserStore.getState().clearUser();
  useProfileDocumentsStore.getState().clear();
  useUpgradePromptStore.getState().reset();
  useContactAdminNoticeStore.getState().reset();
  // Every cached server response belongs to the account that is leaving (codes, visitors,
  // history, notifications, billing...), not only the entitlement/billing/users queries.
  clearQueryCache();
  await clearCheckoutAttempts();
}

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
      await clearUserData();
      useAuthStore.getState().clearAuth();
      resetBroadcastPopupSuppression();
      useNotificationStore.getState().clear();
      const institution = await getSelectedInstitution();
      router.replace(getPostAuthRedirectRoute(institution));
    } finally {
      isProcessingRef.current = false;
    }
  }, [router]);

  const performSignOut = useCallback(
    /** `signedOutBecause`: the server refused the session, so the login screen explains why. */
    async (options?: { signedOutBecause?: SignOutReason }) => {
      setIsReady(false);
      // Done first, while the access token is still valid.
      await unregisterForPushNotifications();
      // A user-initiated sign-out also ends the session server-side. An expired session has
      // nothing left to end (and its token would only be refused).
      if (!options?.signedOutBecause) await revokeCurrentSession();
      await clearUserData();
      useAuthStore.getState().clearAuth();
      resetBroadcastPopupSuppression();
      useNotificationStore.getState().clear();
      await clearAuthState();
      broadcastLogout();
      // Force full component reset by incrementing key
      setResetKey((prev) => prev + 1);
      const institution = await getSelectedInstitution();
      const target = getPostAuthRedirectRoute(institution);

      if (options?.signedOutBecause && target === '/auth/login') {
        router.replace({ pathname: target, params: { signed_out: options.signedOutBecause } });
      } else {
        router.replace(target);
      }
      // Signed out is a known auth state. Nothing else sets this back: loadAuthState only runs
      // once per app start, so leaving it false would keep the root on LoadingTransition.
      setIsReady(true);
    },
    [router]
  );

  // When the server refuses the session (inactivity, end of its lifetime, or ended), the API
  // layer reports it here with the reason, and we sign out with a login-screen notice that says
  // which, rather than leaving every request failing.
  useEffect(() => {
    setUnauthorizedHandler((reason) => {
      void performSignOut({ signedOutBecause: reason });
    });
    return () => setUnauthorizedHandler(null);
  }, [performSignOut]);

  // Coming back to the foreground after a while: refresh before the first request needs it,
  // while the refresh token may still be valid. No-op when signed out or not near expiry.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void getValidAccessToken();
    });
    return () => subscription.remove();
  }, []);

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
    prefetchUserData(userData);
  };

  const signOut = async () => {
    await performSignOut();
  };

  const handleCrossTabLogin = useCallback(
    async (token: string, role: UserRolesType) => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      try {
        // The broadcast carries only the access token; the refresh token and session id are
        // read from the storage the tabs share, so they are never posted to every tab.
        const stored = await getAuthState();
        // Another tab signed in, possibly as a different account: nothing cached here is theirs.
        clearQueryCache();
        adoptStoredSession(
          stored?.access_token === token
            ? { ...stored, role }
            : { access_token: token, refresh_token: null, role, session_id: null }
        );

        const myProfile = (await fetchMe(token)) as User;

        if (myProfile && myProfile.status) {
          useUserStore.setState({ ...myProfile });
          useAuthStore.setState({ role: myProfile.role });
          setIsReady(true);
          prefetchUserData(myProfile);
          setTimeout(() => {
            routeForUser(myProfile);
          }, 50);
        }
      } catch {
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
          adoptStoredSession(localData);

          try {
            // An expired access token is refreshed first when a refresh token was stored. If
            // that fails offline the stored session is kept, and fetchMe decides as before.
            const token = (await getValidAccessToken()) ?? localData.access_token;
            const myProfile = (await fetchMe(token)) as User;

            if (myProfile?.status) {
              useUserStore.setState({ ...myProfile });
              useAuthStore.setState({ role: myProfile.role });
              setIsReady(true);
              prefetchUserData(myProfile);
              try {
                setTimeout(() => {
                  routeForUser(myProfile);
                }, 50);
              } catch {}
              return;
            }
          } catch {}
        }

        if (!isPublicRoute(currentPath, initialURL)) {
          const institution = await getSelectedInstitution();
          try {
            router.replace(getPostAuthRedirectRoute(institution));
          } catch {}
        }
      } catch {
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
