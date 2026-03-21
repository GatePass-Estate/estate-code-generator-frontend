import { fetchMe } from "@/src/lib/api/auth";
import {
  broadcastLogout,
  clearAuthState,
  getAuthState,
  initAuthSync,
} from "@/src/lib/helpers";
import { useAuthStore } from "@/src/lib/stores/authStore";
import { useUserStore } from "@/src/lib/stores/userStore";
import { AuthContextType } from "@/src/types/auth";
import { User } from "@/src/types/user";
import { SplashScreen, usePathname, useRouter } from "expo-router";
import * as Linking from "expo-linking";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { UserRolesType } from "../types/general";

SplashScreen.preventAutoHideAsync();

const AuthContext = createContext<AuthContextType>({
  isReady: false,
  resetKey: 0,
  signIn: async () => {},
  signOut: async () => {},
});

const PUBLIC_AUTH_ROUTES = [
  "/activate",
  "/auth/set-password",
  "/auth/email-activation-status",
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  const isProcessingRef = useRef(false);

  const handleCrossTabLogin = useCallback(
    async (token: string, role: UserRolesType) => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      try {
        useAuthStore.setState({ access_token: token, role });

        const myProfile = (await fetchMe(token)) as User;

        if (myProfile && myProfile.status) {
          useUserStore.setState({ ...myProfile });

          if (
            ["primary_admin", "admin", "resident"].includes(myProfile.role!)
          ) {
            router.replace("/user");
          } else if (myProfile.role === "security") {
            router.replace("/security");
          }
        }
      } catch (error) {
        console.log("Error syncing auth from another tab", error);
        await performSignOut();
      } finally {
        isProcessingRef.current = false;
      }
    },
    [router],
  );

  const handleCrossTabLogout = useCallback(async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    try {
      useUserStore.getState().clearUser();
      useAuthStore.getState().clearAuth();
      router.replace("/auth/login");
    } finally {
      isProcessingRef.current = false;
    }
  }, [router]);

  const performSignOut = useCallback(async () => {
    setIsReady(false);
    useUserStore.getState().clearUser();
    useAuthStore.getState().clearAuth();
    await clearAuthState();
    broadcastLogout();
    // Force full component reset by incrementing key
    setResetKey((prev) => prev + 1);
    router.replace("/auth/login");
  }, [router]);

  const signIn = async (userData: User) => {
    useUserStore.setState({ ...userData });
    setIsReady(true);
  };

  const signOut = async () => {
    await performSignOut();
  };

  const hasLoadedAuth = useRef(false);

  useEffect(() => {
    let cleanupSync: (() => void) | undefined;

    const isPublicRoute = (currentPath: string, initialURL: string | null) => {
      return PUBLIC_AUTH_ROUTES.some(
        (r) =>
          currentPath === r ||
          currentPath.startsWith(r) ||
          (initialURL && initialURL.includes(r)),
      );
    };

    const loadAuthState = async () => {
      if (hasLoadedAuth.current) return;
      hasLoadedAuth.current = true;

      const initialURL = await Linking.getInitialURL();
      const currentPath = pathname;
      const localData = await getAuthState();

      if (localData?.access_token) {
        useAuthStore.setState({
          access_token: localData.access_token,
          role: localData.role,
        });
      }

      try {
        const myProfile = (await fetchMe(
          localData?.access_token || "",
        )) as User;

        if (myProfile && myProfile.status) {
          await signIn(myProfile);
          if (
            ["primary_admin", "admin", "resident"].includes(myProfile.role!)
          ) {
            router.replace("/user");
          } else if (myProfile.role === "security") {
            router.replace("/security");
          }
        } else {
          if (!isPublicRoute(currentPath, initialURL))
            router.replace("/auth/login");
        }
      } catch (error) {
        if (!isPublicRoute(currentPath, initialURL))
          router.replace("/auth/login");
        console.log("Error loading auth state", error);
      } finally {
        setIsReady(true);
        await SplashScreen.hideAsync();
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
