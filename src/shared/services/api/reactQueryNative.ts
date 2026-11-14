import { AppState, Platform } from 'react-native';
import type { AppStateStatus } from 'react-native';
import { focusManager } from '@tanstack/react-query';

/**
 * PERF-05: refetch stale queries when the app returns to the foreground.
 * (Online manager skipped — no NetInfo dependency in this project.)
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
}
