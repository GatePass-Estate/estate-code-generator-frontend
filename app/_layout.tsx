import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Link, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme, useInitialAndroidBarSync } from '@/lib/useColorScheme';
import { NAV_THEME } from '@/theme';
import { Pressable, View } from 'react-native';
import { cn } from '@/lib/cn';
import { Icon } from '@roninoss/icons';
import { ThemeToggle } from '@/components/ThemeToggle';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useInitialAndroidBarSync();
  const { colorScheme, isDarkColorScheme } = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const [isLoggedIn, setIsLoggedIn] = useState(false);

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
      {/* WRAP YOUR APP WITH ANY ADDITIONAL PROVIDERS HERE */}
      {/* <ExampleProvider> */}
      <ThemeProvider value={NAV_THEME[colorScheme]}>
        {/* <Stack>
          {!isLoggedIn ? (
            <Stack.Screen name='index' options={{ headerShown: false }} />
          ) : (
            <Stack.Screen name='Home' options={{ headerShown: false }} />
          )}
          <Stack.Screen name='+not-found' />
        </Stack>
        <StatusBar style='auto' /> */}

        <Stack screenOptions={SCREEN_OPTIONS}>
          <Stack.Screen name='index' options={INDEX_OPTIONS} />
          <Stack.Screen name='Home' options={MODAL_OPTIONS} />
          <Stack.Screen
            name='active_codes'
            options={{ title: 'Active Codes' }}
          />
        </Stack>
      </ThemeProvider>
    </>
  );
}

const SCREEN_OPTIONS = {
  animation: 'ios_from_right', // for android
} as const;

const INDEX_OPTIONS = {
  headerLargeTitle: true,
  title: 'GMS',
  headerRight: () => <SettingsIcon />,
} as const;

function SettingsIcon() {
  const { colors } = useColorScheme();
  return (
    <Link href='/modal' asChild>
      <Pressable className='opacity-80'>
        {({ pressed }) => (
          <View className={cn(pressed ? 'opacity-50' : 'opacity-90')}>
            <Icon name='cog-outline' color={colors.foreground} />
          </View>
        )}
      </Pressable>
    </Link>
  );
}

const MODAL_OPTIONS = {
  presentation: 'modal',
  animation: 'fade_from_bottom', // for android
  title: 'Settings',
  headerRight: () => <ThemeToggle />,
} as const;
