import { Platform, useColorScheme as useDeviceColorScheme, View } from 'react-native';
import { usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { useAndroidBottomInset } from '@/src/shared/hooks/useAndroidBottomInset';
import {
  getAndroidNavBarBackground,
  statusBarStyleForPath,
  useInitialAndroidBarSync,
} from '@/src/shared/hooks/useAndroidNavBar';

/**
 * Global Android chrome: status-bar icon style for the current route + bottom nav strip.
 * One StatusBar here so screens never “lose” icons after leaving a dark header (e.g. Admin Tools).
 */
export default function AndroidNavBarGlobal() {
  const deviceColorScheme = useDeviceColorScheme();
  const pathname = usePathname();
  const { systemBottom } = useAndroidBottomInset();
  const isUserProfile = /^\/admin\/users\/[^/]+$/.test(pathname);
  const statusStyle = statusBarStyleForPath(pathname);

  useInitialAndroidBarSync();

  return (
    <>
      {Platform.OS === 'android' ? <StatusBar style={statusStyle} /> : null}
      {Platform.OS === 'android' && systemBottom > 0 ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: systemBottom,
            backgroundColor: isUserProfile
              ? '#F6F7F7'
              : getAndroidNavBarBackground(deviceColorScheme),
            zIndex: 9999,
            elevation: 9999,
          }}
        />
      ) : null}
    </>
  );
}
