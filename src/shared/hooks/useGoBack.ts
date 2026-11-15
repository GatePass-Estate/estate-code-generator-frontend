import { useCallback } from 'react';
import { Platform } from 'react-native';
import { router, useNavigation } from 'expo-router';

/**
 * App-wide back: pop the navigation stack so the previous screen slides in
 * (same motion as Broadcast → Admin Tools).
 *
 * Rule for every screen:
 * 1. Open with `router.push` on the **same** stack (e.g. `/admin/broadcast`, `/admin/report`).
 * 2. Leave with `<Back />` / `useGoBack()` — do **not** `replace` / `dismissTo` when the stack
 *    can pop; those skip the slide and often land on the wrong place.
 * 3. Only `dismissTo` / `replace` when there is no history (deep link, cold start, cross-role).
 *
 * Expo Router's `router.back()` queues through React state (~180–230 ms on Android). This calls
 * React Navigation directly (like BlueSky's `useGoBack`). Web keeps `router.back()` for history.
 */
export function useGoBack(): () => void {
  const navigation = useNavigation();
  return useCallback(() => {
    if (Platform.OS !== 'web') {
      if (navigation.canGoBack()) {
        navigation.goBack();
        return;
      }
      let parent = navigation.getParent();
      while (parent) {
        if (parent.canGoBack()) {
          parent.goBack();
          return;
        }
        parent = parent.getParent();
      }
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
  }, [navigation]);
}
