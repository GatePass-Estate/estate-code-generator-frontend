import { useFonts } from 'expo-font';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import AndroidNavBarGlobal from '@/src/shared/components/navigation/AndroidNavBarGlobal';
import { AuthProvider, useAuth } from '@/src/features/auth/hooks/useAuthContext';
import 'react-native-reanimated';
import { Inter, UbuntuSans } from '@/src/shared/constants/fonts';
import './global.css';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/src/shared/services/api/queryClient';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect, useLayoutEffect } from 'react';
import LoadingTransition from '@/src/shared/components/feedback/LoadingTransition';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { patchAndroidDoubleNavigation } from '@/src/shared/utils/androidActionLock';
import AppErrorBoundary from '@/src/shared/components/feedback/AppErrorBoundary';
import { installGlobalErrorHandlers } from '@/src/shared/utils/globalErrorHandlers';
import { logger } from '@/src/shared/utils/logger';
import { installReactQueryNativeManagers } from '@/src/shared/services/api/reactQueryNative';

patchAndroidDoubleNavigation();
installGlobalErrorHandlers();
installReactQueryNativeManagers();

ExpoSplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  // Stay on the navy loader (`app/index`) until auth bootstrap replaces to the real destination.
  // Starting on institution made signed-in reloads flash the institution screen.
  initialRouteName: 'index',
};

function RootLayoutContent() {
  const { resetKey, isReady } = useAuth();

  useLayoutEffect(() => {
    patchAndroidDoubleNavigation();
  }, []);

  if (!isReady) {
    return <LoadingTransition />;
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        key={resetKey}
        screenOptions={{
          headerShown: false,
          animation: 'none',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen
          name="auth/institution"
          options={{ animation: 'slide_from_left', animationTypeForReplace: 'pop' }}
        />
        <Stack.Screen name="auth/login" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="auth/two-factor" />
        <Stack.Screen name="auth/tos" />
        <Stack.Screen name="auth/set-password" />
        <Stack.Screen name="auth/forgot-password" />
        <Stack.Screen name="auth/reset-password" />
        <Stack.Screen name="auth/data-protection-policy" />
        <Stack.Screen name="activate" />
        <Stack.Screen name="auth/email-activation-status" />
        <Stack.Screen name="(protected)" />
      </Stack>
      <AndroidNavBarGlobal />
    </>
  );
}

export default function RootLayout() {
  // PERF-09: skip unused italic/extraLight faces so splash unblocks sooner.
  const [loaded, fontError] = useFonts({
    Roboto: require('../src/assets/fonts/Roboto-VariableFont_wdth,wght.ttf'),
    UbuntuSans: require('../src/assets/fonts/UbuntuSans-VariableFont_wdth,wght.ttf'),

    [UbuntuSans.light]: require('../src/assets/fonts/UbuntuSans-Light.ttf'),
    [UbuntuSans.regular]: require('../src/assets/fonts/UbuntuSans-Regular.ttf'),
    [UbuntuSans.medium]: require('../src/assets/fonts/UbuntuSans-Medium.ttf'),
    [UbuntuSans.semiBold]: require('../src/assets/fonts/UbuntuSans-SemiBold.ttf'),
    [UbuntuSans.bold]: require('../src/assets/fonts/UbuntuSans-Bold.ttf'),
    [UbuntuSans.extraBold]: require('../src/assets/fonts/UbuntuSans-ExtraBold.ttf'),

    [Inter.light]: require('../src/assets/fonts/Inter_18pt-Light.ttf'),
    [Inter.regular]: require('../src/assets/fonts/Inter_18pt-Regular.ttf'),
    [Inter.medium]: require('../src/assets/fonts/Inter_18pt-Medium.ttf'),
    [Inter.semiBold]: require('../src/assets/fonts/Inter_18pt-SemiBold.ttf'),
    [Inter.mediumItalic]: require('../src/assets/fonts/Inter_18pt-MediumItalic.ttf'),
    [Inter.extraBold]: require('../src/assets/fonts/Inter_18pt-ExtraBold.ttf'),
  });

  useEffect(() => {
    if (fontError) {
      // STB-14: continue with system fonts; report so we know field devices hit this.
      logger.error('Custom fonts failed to load; falling back to system fonts', fontError);
    }
    if (loaded || fontError) {
      ExpoSplashScreen.hideAsync().catch(() => {});
    }
  }, [loaded, fontError]);

  if (!loaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AppErrorBoundary name="root">
          <AuthProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <RootLayoutContent />
            </GestureHandlerRootView>
          </AuthProvider>
        </AppErrorBoundary>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
