import React from 'react';
import { useFonts } from 'expo-font';
import { Link, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme, useInitialAndroidBarSync } from '@/lib/useColorScheme';
import { NAV_THEME } from '@/theme';
import { Pressable, View } from 'react-native';
import { cn } from '@/lib/cn';
import { Icon } from '@roninoss/icons';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AuthProvider, useAuth } from '@/hooks/useAuthContext';
import { ThemeProvider } from '@react-navigation/native';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useInitialAndroidBarSync();
  const { colorScheme, isDarkColorScheme } = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <>
      <StatusBar
        key={`root-status-bar-${isDarkColorScheme ? 'light' : 'dark'}`}
        style={isDarkColorScheme ? 'light' : 'dark'}
      />
      <AuthProvider>
        <ThemeProvider value={NAV_THEME[colorScheme]}>
          <Stack>
            <Stack.Screen name='(admin)' options={{ headerShown: false }} />
            <Stack.Screen name='(protected)' options={{ headerShown: false }} />
            <Stack.Screen
              name='login'
              options={{
                headerShown: false,
                animation: 'none',
              }}
            />
          </Stack>
        </ThemeProvider>
      </AuthProvider>
    </>
  );
}
