import AsyncStorage from '@react-native-async-storage/async-storage';
import { SplashScreen, useRouter } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';

SplashScreen.preventAutoHideAsync();

type User = {
  id: string;
  name: string;
  email: string;
  photo?: string;
  role: 'admin' | 'user';
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
      console.log('Error saving auth state', error);
    }
  };

  const clearAuthState = async () => {
    try {
      await AsyncStorage.removeItem(authStorageKey);
    } catch (error) {
      console.log('Error clearing auth state', error);
    }
  };

  const signIn = async (userData: any) => {
    const newUser = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      photo: userData.picture,
      role: userData.role || 'user',
      token: userData.token,
    };
    setUser(newUser);
    setIsReady(true);
    await storeAuthState(newUser);

    // Redirect based on role
    if (newUser.role === 'admin') {
      router.replace('/(admin)');
    } else {
      router.replace('/(protected)');
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
      // Simulate loading delay (remove in production)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      try {
        const jsonValue = await AsyncStorage.getItem(authStorageKey);
        if (jsonValue) {
          const savedUser = JSON.parse(jsonValue);
          setUser(savedUser);
        }
      } catch (error) {
        console.log('Error loading auth state', error);
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
