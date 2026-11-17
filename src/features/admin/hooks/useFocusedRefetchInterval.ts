import { useIsFocused } from 'expo-router';

/** `refetchInterval` that polls only while this screen is focused (no hand-rolled setInterval). */
export function useFocusedRefetchInterval(intervalMs: number): number | false {
  const isFocused = useIsFocused();
  return isFocused ? intervalMs : false;
}
