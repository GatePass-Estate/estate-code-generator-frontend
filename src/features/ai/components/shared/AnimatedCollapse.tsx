import { useEffect, type ReactNode } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

/** Same curve as the subscription tier card. */
const COLLAPSE = {
  duration: 300,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1),
};

export function useCollapse(open: boolean) {
  const progress = useSharedValue(open ? 1 : 0);
  const measuredHeight = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(open ? 1 : 0, COLLAPSE);
  }, [open, progress]);

  const bodyStyle = useAnimatedStyle(() => ({
    height: measuredHeight.value * progress.value,
    opacity: progress.value,
    overflow: 'hidden',
  }));

  const caretStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${(progress.value - 1) * 90}deg` }],
  }));

  const onContentLayout = (event: LayoutChangeEvent) => {
    const next = Math.ceil(event.nativeEvent.layout.height);
    if (next > 0 && Math.abs(next - measuredHeight.value) > 1) {
      measuredHeight.value = next;
    }
  };

  return { bodyStyle, caretStyle, onContentLayout };
}

export function CollapseBody({
  open,
  motion,
  children,
}: {
  open: boolean;
  motion: ReturnType<typeof useCollapse>;
  children: ReactNode;
}) {
  return (
    <Animated.View style={motion.bodyStyle}>
      <View
        className="absolute left-0 right-0 top-0"
        onLayout={motion.onContentLayout}
        pointerEvents={open ? 'auto' : 'none'}
      >
        {children}
      </View>
    </Animated.View>
  );
}
