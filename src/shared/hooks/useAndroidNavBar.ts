import * as NavigationBar from 'expo-navigation-bar';
import { setStatusBarBackgroundColor, setStatusBarStyle } from 'expo-status-bar';
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
 * Most GatePass screens are light (#F6F7F7). On Android edge-to-edge + device dark mode,
 * the system can leave light status icons — clock/battery vanish on light backgrounds.
 * Force dark icons unless the route has a dark header (admin tools).
 */
function applyAndroidStatusBar(pathname: string) {
  const darkHeader = pathname === '/admin' || pathname === '/admin/' || pathname.endsWith('/admin');
  const style = darkHeader ? 'light' : 'dark';
  setStatusBarStyle(style);
  RNStatusBar.setBarStyle(darkHeader ? 'light-content' : 'dark-content', true);
  // Transparent so the screen background shows through; icons stay readable via style.
  RNStatusBar.setBackgroundColor('transparent', true);
  RNStatusBar.setTranslucent(true);
  setStatusBarBackgroundColor('transparent', true);
}

export function getAndroidNavBarBackground(scheme: ColorSchemeName | null | undefined): string {
  return ANDROID_NAV_BAR[resolveDeviceColorScheme(scheme)].background;
}

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
