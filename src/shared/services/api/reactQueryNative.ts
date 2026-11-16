import { AppState, Platform } from 'react-native';
import type { AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { focusManager, onlineManager } from '@tanstack/react-query';

/**
 * Native lifecycle for TanStack Query (BlueSky wires the same two managers in src/lib/react-query.tsx):
 * - focus (PERF-05): stale queries refetch when the app returns to the foreground;
 * - online: while the device is offline, queries pause instead of failing and burning retries,
 *   and resume as soon as the connection is back.
 * Web uses TanStack's built-in window focus / online listeners.
 */
export function installReactQueryNativeManagers() {
  if (Platform.OS === 'web') return;

  focusManager.setEventListener((handleFocus) => {
    const onChange = (status: AppStateStatus) => {
      handleFocus(status === 'active');
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  });

  onlineManager.setEventListener((setOnline) =>
    NetInfo.addEventListener((state) => {
      // `isInternetReachable` is null until NetInfo has checked; only a definite `false` is offline,
      // so a slow first check never pauses requests.
      setOnline(Boolean(state.isConnected) && state.isInternetReachable !== false);
    })
  );
}
