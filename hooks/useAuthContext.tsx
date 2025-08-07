import AsyncStorage from '@react-native-async-storage/async-storage';
import { SplashScreen, useRouter } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';

SplashScreen.preventAutoHideAsync();

type User = {
  first_name: string;
  last_name: string;
  email?: string;
  home_address?: string;
  phone_number?: string;
  role: 'primary_admin' | 'root' | 'admin' | 'security' | 'resident';
  token: string;
} | null;

type AuthContextType = {
  user: User;
  isReady: boolean;
  signIn: (userData: any) => Promise<void>;
  signOut: () => Promise<void>;
};

const authStorageKey = 'auth-key';
const AuthContext = createContext<AuthContextType>({
  user: null,
  isReady: false,
  signIn: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();

  const storeAuthState = async (userData: User) => {
    try {
      const jsonValue = JSON.stringify(userData);
      await AsyncStorage.setItem(authStorageKey, jsonValue);
    } catch (error) {
      // console.log('Error saving auth state', error);
    }
  };

  const clearAuthState = async () => {
    try {
      await AsyncStorage.removeItem(authStorageKey);
    } catch (error) {
      // console.log('Error clearing auth state', error);
    }
  };

  const signIn = async (userData: any) => {
  // userData is the raw response from /auth/login, not just the token
  const token = userData.access_token;
  const role = userData.role;

  // console.log("Using token:", token);

  try {
    const profileRes = await fetch('http://10.234.76.195:9034/api/v1/users/profile/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const responseText = await profileRes.text();
    // console.log("Profile fetch status:", profileRes.status);
    // console.log("Profile fetch response:", responseText);

    if (!profileRes.ok) {
      throw new Error("Failed to fetch profile");
    }

    const profile = JSON.parse(responseText);

    const newUser = {
      first_name: profile.first_name,
      last_name: profile.last_name,
      email: profile.email,
      home_address: profile.home_address,
      phone_number: profile.phone_number,
      role: role,
      token: token,
    };

    setUser(newUser);
    setIsReady(true);
    await storeAuthState(newUser);
  } catch (error) {
    // console.log("Error during signIn:", error);
  }
};



  const signOut = async () => {
    setUser(null);
    setIsReady(false);
    await clearAuthState();
    router.replace('/login');
  };

  useEffect(() => {
    const loadAuthState = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      try {
        const jsonValue = await AsyncStorage.getItem(authStorageKey);
        if (jsonValue) {
          const savedUser = JSON.parse(jsonValue);
          setUser(savedUser);
        }
      } catch (error) {
        // console.log('Error loading auth state', error);
      } finally {
        setIsReady(true);
      }
    };

    loadAuthState();
  }, []);

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  return (
    <AuthContext.Provider value={{ user, isReady, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
