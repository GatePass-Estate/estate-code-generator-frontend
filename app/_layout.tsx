import { View } from 'react-native';
import { useFonts } from 'expo-font';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import AndroidNavBarGlobal from '@/src/components/common/AndroidNavBarGlobal';
import { AuthProvider, useAuth } from '@/src/hooks/useAuthContext';
import 'react-native-reanimated';
import { Inter, UbuntuSans } from '@/src/constants/fonts';
// @ts-ignore
import './global.css';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import LoadingTransition from '@/src/components/common/LoadingTransition';

ExpoSplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const { resetKey, isReady } = useAuth();

  if (!isReady) {
    return <LoadingTransition />;
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        key={resetKey}
        initialRouteName="auth/institution"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="auth/institution" options={{ animation: 'none' }} />
        <Stack.Screen name="auth/login" options={{ animation: 'none' }} />
        <Stack.Screen name="auth/tos" options={{ animation: 'none' }} />
        <Stack.Screen name="auth/set-password" />
        <Stack.Screen name="auth/forgot-password" options={{ animation: 'none' }} />
        <Stack.Screen name="auth/reset-password" options={{ animation: 'none' }} />
        <Stack.Screen name="auth/data-protection-policy" options={{ animation: 'none' }} />
        <Stack.Screen name="activate" />
        <Stack.Screen name="auth/email-activation-status" />
        <Stack.Screen name="(protected)" />
      </Stack>
      <AndroidNavBarGlobal />
    </>
  );
}

export default function RootLayout() {
  const [loaded, fontError] = useFonts({
    RobotoItalic: require('../src/assets/fonts/Roboto-Italic-VariableFont_wdth,wght.ttf'),
    Roboto: require('../src/assets/fonts/Roboto-VariableFont_wdth,wght.ttf'),
    UbuntuSans: require('../src/assets/fonts/UbuntuSans-VariableFont_wdth,wght.ttf'),
    UbuntuSansItalic: require('../src/assets/fonts/UbuntuSans-Italic-VariableFont_wdth,wght.ttf'),

    [UbuntuSans.extraLight]: require('../src/assets/fonts/UbuntuSans-ExtraLight.ttf'),
    [UbuntuSans.light]: require('../src/assets/fonts/UbuntuSans-Light.ttf'),
    [UbuntuSans.regular]: require('../src/assets/fonts/UbuntuSans-Regular.ttf'),
    [UbuntuSans.medium]: require('../src/assets/fonts/UbuntuSans-Medium.ttf'),
    [UbuntuSans.semiBold]: require('../src/assets/fonts/UbuntuSans-SemiBold.ttf'),
    [UbuntuSans.bold]: require('../src/assets/fonts/UbuntuSans-Bold.ttf'),
    [UbuntuSans.extraBold]: require('../src/assets/fonts/UbuntuSans-ExtraBold.ttf'),

    [Inter.extraLight]: require('../src/assets/fonts/Inter_18pt-ExtraLight.ttf'),
    [Inter.light]: require('../src/assets/fonts/Inter_18pt-Light.ttf'),
    [Inter.regular]: require('../src/assets/fonts/Inter_18pt-Regular.ttf'),
    [Inter.medium]: require('../src/assets/fonts/Inter_18pt-Medium.ttf'),
    [Inter.semiBold]: require('../src/assets/fonts/Inter_18pt-SemiBold.ttf'),
    [Inter.mediumItalic]: require('../src/assets/fonts/Inter_18pt-MediumItalic.ttf'),
  });

  useEffect(() => {
    if (loaded || fontError) {
      ExpoSplashScreen.hideAsync().catch((error) => {
        console.log('Error hiding native splash screen', error);
      });
    }
  }, [loaded, fontError]);

  useEffect(() => {
    if (fontError) {
      console.log('Error loading fonts', fontError);
    }
  }, [fontError]);

  if (!loaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <View style={{ flex: 1 }}>
            <RootLayoutContent />
          </View>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
