import { ReactNode } from 'react';
import { Dimensions, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const SCREEN_WIDTH = Dimensions.get('window').width;
/** How far the row must travel before the action commits. */
const ACTION_THRESHOLD = 80;
const TIMING = { duration: 180 };

type SwipeableRowProps = {
  children: ReactNode;
  /** Swipe left past the threshold. Omit to disable the delete direction. */
  onSwipeLeft?: () => void;
  /** Swipe right past the threshold. */
  onSwipeRight?: () => void;
  leftActionLabel?: string;
  rightActionLabel?: string;
  /** Colour of the panel revealed when swiping left (the destructive side). */
  deleteColor?: string;
  openColor?: string;
};

/**
 * Row that reveals an action panel as it is dragged.
 *
 * Dragging left reveals the destructive action and, past the threshold, slides
 * the row off-screen before firing `onSwipeLeft` so the removal reads as one
 * motion. Dragging right springs back and fires `onSwipeRight`, since opening
 * navigates away rather than removing the row.
 */
export default function SwipeableRow({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftActionLabel = 'Open',
  rightActionLabel = 'Delete',
  deleteColor = '#E30404',
  openColor = '#113E55',
}: SwipeableRowProps) {
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);

  const panGesture = Gesture.Pan()
    // Only take over once the drag is clearly horizontal, so the list can
    // still scroll vertically through this row.
    .activeOffsetX([-12, 12])
    .failOffsetY([-14, 14])
    .onBegin(() => {
      startX.value = translateX.value;
    })
    .onUpdate((event) => {
      const next = startX.value + event.translationX;
      // Clamp each direction to whatever the caller actually enabled.
      if (next < 0 && !onSwipeLeft) return;
      if (next > 0 && !onSwipeRight) return;
      translateX.value = next;
    })
    .onEnd(() => {
      if (onSwipeLeft && translateX.value <= -ACTION_THRESHOLD) {
        translateX.value = withTiming(-SCREEN_WIDTH, TIMING, (finished) => {
          if (finished) runOnJS(onSwipeLeft)();
        });
        return;
      }

      if (onSwipeRight && translateX.value >= ACTION_THRESHOLD) {
        translateX.value = withTiming(0, TIMING, (finished) => {
          if (finished) runOnJS(onSwipeRight)();
        });
        return;
      }

      translateX.value = withTiming(0, TIMING);
    });

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Each panel only fades in while the row is dragged towards it.
  const deletePanelStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < 0 ? Math.min(1, -translateX.value / ACTION_THRESHOLD) : 0,
  }));

  const openPanelStyle = useAnimatedStyle(() => ({
    opacity: translateX.value > 0 ? Math.min(1, translateX.value / ACTION_THRESHOLD) : 0,
  }));

  return (
    <View className="relative">
      <View className="absolute inset-0 flex-row items-center justify-between rounded-[8px] overflow-hidden">
        <Animated.View
          style={[openPanelStyle, { backgroundColor: openColor }]}
          className="h-full justify-center px-5 rounded-l-[8px]"
        >
          <Text className="text-white font-ubuntu-semibold text-xs">{leftActionLabel}</Text>
        </Animated.View>

        <Animated.View
          style={[deletePanelStyle, { backgroundColor: deleteColor }]}
          className="h-full justify-center px-5 rounded-r-[8px]"
        >
          <Text className="text-white font-ubuntu-semibold text-xs">{rightActionLabel}</Text>
        </Animated.View>
      </View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={rowStyle}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
}
