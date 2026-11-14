import * as NavigationBar from 'expo-navigation-bar';
import { setStatusBarStyle } from 'expo-status-bar';
import { usePathname } from 'expo-router';
import * as React from 'react';
import {
  Appearance,
  AppState,
  ColorSchemeName,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';

/** Android 3-button nav bar: our rule — not the system default. */
const ANDROID_NAV_BAR = {
  light: {
    background: '#FFFFFF',
    buttons: 'dark' as const,
    style: 'light' as const,
  },
  dark: {
    background: '#000000',
    buttons: 'light' as const,
    style: 'dark' as const,
  },
} as const;

function resolveDeviceColorScheme(scheme: ColorSchemeName | null | undefined): 'light' | 'dark' {
  return scheme === 'dark' ? 'dark' : 'light';
}

function applyAndroidNavBar(colorScheme: 'light' | 'dark') {
  const theme = ANDROID_NAV_BAR[colorScheme];
  NavigationBar.setStyle(theme.style);
}

/**
 * Routes whose top chrome is dark (need light status icons). Everything else is
 * light grey/white and must use dark icons so clock/battery stay visible on Android.
 */
export function statusBarStyleForPath(pathname: string): 'light' | 'dark' {
  const normalized = (pathname ?? '').replace(/\/+$/, '') || '/';
  // Admin Tools home only — /admin/users and other nested admin screens are light.
  if (normalized === '/admin') return 'light';
  return 'dark';
}

/**
 * Force readable status icons on every Android screen. Device dark mode + edge-to-edge
 * otherwise leaves light icons on #F6F7F7 and the bar looks "all white"/empty.
 */
export function applyAndroidStatusBar(pathname: string) {
  if (Platform.OS !== 'android') return;

  const style = statusBarStyleForPath(pathname);
  setStatusBarStyle(style);
  RNStatusBar.setBarStyle(style === 'light' ? 'light-content' : 'dark-content', true);

  const androidBar = RNStatusBar as typeof RNStatusBar & {
    setBackgroundColor?: (color: string, animated?: boolean) => void;
    setTranslucent?: (translucent: boolean) => void;
  };
  androidBar.setBackgroundColor?.('transparent', true);
  androidBar.setTranslucent?.(true);
}

export function getAndroidNavBarBackground(scheme: ColorSchemeName | null | undefined): string {
  return ANDROID_NAV_BAR[resolveDeviceColorScheme(scheme)].background;
}

/** Keeps status + nav bars in sync on every route / theme / foreground change. */
export function useInitialAndroidBarSync() {
  const pathname = usePathname();

  const applyDeviceBars = React.useCallback(
    (scheme: ColorSchemeName | null | undefined) => {
      applyAndroidNavBar(resolveDeviceColorScheme(scheme));
      applyAndroidStatusBar(pathname ?? '');
    },
    [pathname]
  );

  React.useEffect(() => {
    if (Platform.OS !== 'android') return;
    applyDeviceBars(Appearance.getColorScheme());
  }, [pathname, applyDeviceBars]);

  React.useEffect(() => {
    if (Platform.OS !== 'android') return;

    applyDeviceBars(Appearance.getColorScheme());

    const appearanceSubscription = Appearance.addChangeListener(({ colorScheme }) =>
      applyDeviceBars(colorScheme)
    );

    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        applyDeviceBars(Appearance.getColorScheme());
      }
    });

    return () => {
      appearanceSubscription.remove();
      appStateSubscription.remove();
    };
  }, [applyDeviceBars]);
}
