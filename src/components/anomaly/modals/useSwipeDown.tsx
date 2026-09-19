import { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { Gesture } from 'react-native-gesture-handler';

export function useSwipeDown(onClose: () => void) {
  const translateY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onChange((event) => {
      if (translateY.value + event.changeY > 0) {
        translateY.value += event.changeY;
      } else {
        translateY.value = 0;
      }
    })
    .onEnd((event) => {
      if (translateY.value > 150 || event.velocityY > 500) {
        translateY.value = withSpring(800, { damping: 20, stiffness: 90 });
        runOnJS(onClose)();
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 90 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  return { panGesture, animatedStyle, translateY };
}
