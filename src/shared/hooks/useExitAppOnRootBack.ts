import { useCallback } from 'react';
import { Alert, BackHandler, Platform } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

/**
 * STB-13: on Android root tab homes, hardware back either pops an inner stack
 * screen or confirms exiting the app (instead of doing nothing).
 */
export function useExitAppOnRootBack() {
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return;

      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        if (router.canGoBack()) {
          router.back();
          return true;
        }

        Alert.alert('Exit GatePass?', 'Close the app?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Exit', style: 'destructive', onPress: () => BackHandler.exitApp() },
        ]);
        return true;
      });

      return () => subscription.remove();
    }, [router])
  );
}
