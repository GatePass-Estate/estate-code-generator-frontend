import { useLayoutEffect } from 'react';
import { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export const CATEGORY_TRANSITION_MS = 280;
export const CATEGORY_EASE_OUT = Easing.bezier(0.25, 0.1, 0.25, 1);

/** Opacity-only fade when the selected category changes. No transforms, so iOS and Android render the same frames. */
export function useSelectionTransition(selectedId: string, enabled = true) {
  const progress = useSharedValue(1);
  // Layout effect: reset before paint so a freshly swapped panel never flashes at full opacity.
  useLayoutEffect(() => {
    if (!enabled) {
      progress.value = 1;
      return;
    }
    progress.value = 0;
    progress.value = withTiming(1, { duration: CATEGORY_TRANSITION_MS, easing: CATEGORY_EASE_OUT });
  }, [selectedId, enabled, progress]);
  return useAnimatedStyle(() => ({
    opacity: 0.35 + progress.value * 0.65,
  }));
}
