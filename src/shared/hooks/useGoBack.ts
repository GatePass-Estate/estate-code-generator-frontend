import { useCallback } from 'react';
import { Platform } from 'react-native';
import { router, useNavigation } from 'expo-router';

/**
 * Go back one screen, as fast as the Android back key.
 *
 * Expo Router's `router.back()` does not navigate straight away: it queues the request in React
 * state and dispatches it from an effect after the next render (expo-router RoutingQueueDrainer).
 * On Android that costs a noticeable beat (measured ~180–230 ms in dev before anything moved),
 * while the hardware back key, which goes straight to React Navigation, reacts at once. This calls
 * React Navigation directly, the way BlueSky's `useGoBack` does.
 *
 * Web keeps `router.back()` so the browser's history and URL stay in step.
 */
export function useGoBack(): () => void {
  const navigation = useNavigation();
  return useCallback(() => {
    if (Platform.OS !== 'web' && navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    router.back();
  }, [navigation]);
}
