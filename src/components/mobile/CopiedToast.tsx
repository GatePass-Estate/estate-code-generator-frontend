import { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CopyIcon } from '@/src/assets/svgs';

type CopiedToastProps = {
  visible: boolean;
};

export function CopiedToast({ visible }: CopiedToastProps) {
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 120 });
      scale.value = withSequence(
        withSpring(1.08, { damping: 6, stiffness: 260 }),
        withSpring(1, { damping: 10, stiffness: 260 })
      );
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      scale.value = withTiming(0.6, { duration: 150 });
    }
  }, [visible, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.container, { top: insets.top + 8 }, animatedStyle]}
    >
      <Animated.View className="flex-row items-center gap-2.5 rounded-full bg-[#E5F6FF] px-4 py-2.5">
        <CopyIcon width={16} height={16} />
        <Text className="text-sm font-inter-medium text-[#113E55]">Copied</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 999,
    elevation: 999,
    alignItems: 'center',
  },
});
