import { Platform } from 'react-native';
import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sharedStyles, TAB_BAR_BASE_HEIGHT, TAB_BAR_FAB_OVERHANG } from '@/src/theme/styles';

/** Typical 3-button nav bar height when safe-area insets are not reported. */
const ANDROID_NAV_BAR_FALLBACK = 48;

export function useAndroidBottomInset() {
  const { bottom } = useSafeAreaInsets();
  const systemBottom =
    Platform.OS === 'android' ? (bottom > 0 ? bottom : ANDROID_NAV_BAR_FALLBACK) : bottom;

  const visualHeight = TAB_BAR_BASE_HEIGHT + TAB_BAR_FAB_OVERHANG;
  // iOS: 49px strip + home-indicator inset only when present (0 on SE / 8 / etc.)
  const tabBarHeight = Platform.OS === 'ios' ? TAB_BAR_BASE_HEIGHT + bottom : visualHeight;

  const tabBarStyle = useMemo(
    () => [
      sharedStyles.tabBar,
      {
        position: 'absolute' as const,
        left: 0,
        right: 0,
        bottom: 0,
        height: tabBarHeight,
        paddingBottom: Platform.OS === 'ios' ? bottom : 0,
        backgroundColor: 'transparent',
        borderTopWidth: 0,
        overflow: 'visible' as const,
        zIndex: 100,
        elevation: 0,
      },
      Platform.OS === 'android' && {
        bottom: systemBottom,
        height: visualHeight,
        paddingBottom: 0,
      },
    ],
    [tabBarHeight, bottom, systemBottom, visualHeight]
  );

  return {
    systemBottom,
    tabBarHeight,
    /**
     * Space to clear the opaque teal strip + home indicator (when any).
     * FAB overhang floats above content and is not included.
     * On iPhones without a home indicator, `systemBottom` is 0 — no extra gap.
     */
    tabContentPadding: TAB_BAR_BASE_HEIGHT + systemBottom,
    tabBarStyle,
  };
}
