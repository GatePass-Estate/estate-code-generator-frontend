import { Platform, useColorScheme as useDeviceColorScheme, View } from 'react-native';

import { useAndroidBottomInset } from '@/src/hooks/useAndroidBottomInset';
import { getAndroidNavBarBackground, useInitialAndroidBarSync } from '@/src/hooks/useAndroidNavBar';

/** Global Android 3-button nav: black/white strip + icon style on every screen. */
export default function AndroidNavBarGlobal() {
  const deviceColorScheme = useDeviceColorScheme();
  const { systemBottom } = useAndroidBottomInset();

  useInitialAndroidBarSync();

  if (Platform.OS !== 'android' || systemBottom <= 0) {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: systemBottom,
        backgroundColor: getAndroidNavBarBackground(deviceColorScheme),
        zIndex: 9999,
        elevation: 9999,
      }}
    />
  );
}
