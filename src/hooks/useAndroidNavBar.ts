import * as NavigationBar from 'expo-navigation-bar';
import { usePathname } from 'expo-router';
import * as React from 'react';
import { Appearance, AppState, ColorSchemeName, Platform } from 'react-native';

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

export function getAndroidNavBarBackground(scheme: ColorSchemeName | undefined): string {
  return ANDROID_NAV_BAR[resolveDeviceColorScheme(scheme)].background;
}

export function useInitialAndroidBarSync() {
  const pathname = usePathname();

  const applyDeviceNavBar = React.useCallback((scheme: ColorSchemeName | null | undefined) => {
    applyAndroidNavBar(resolveDeviceColorScheme(scheme));
  }, []);

  React.useEffect(() => {
    if (Platform.OS !== 'android') return;
    applyDeviceNavBar(Appearance.getColorScheme());
  }, [pathname, applyDeviceNavBar]);

  React.useEffect(() => {
    if (Platform.OS !== 'android') return;

    applyDeviceNavBar(Appearance.getColorScheme());

    const appearanceSubscription = Appearance.addChangeListener(({ colorScheme }) =>
      applyDeviceNavBar(colorScheme)
    );

    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        applyDeviceNavBar(Appearance.getColorScheme());
      }
    });

    return () => {
      appearanceSubscription.remove();
      appStateSubscription.remove();
    };
  }, [applyDeviceNavBar]);
}
