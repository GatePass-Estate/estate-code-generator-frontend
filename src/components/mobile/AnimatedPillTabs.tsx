import { useEffect } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

/* Reanimated shared values are mutated on the UI thread; Compiler immutability rules don't apply. */

export const PILL_TRACK_WIDTH = 229;
export const PILL_TRACK_HEIGHT = 40;
export const PILL_ACTIVE_WIDTH = 119;

const SPRING_CONFIG = {
  damping: 15,
  stiffness: 150,
  mass: 0.7,
};

export type AnimatedPillTabOption<T extends string> = {
  value: T;
  label: string;
};

type AnimatedPillTabsProps<T extends string> = {
  options: readonly [AnimatedPillTabOption<T>, AnimatedPillTabOption<T>];
  value: T;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
  /** Total track width. Default 229. */
  width?: number;
  /** Active indicator width. Default 119. Right segment gets the remainder. */
  activeWidth?: number;
  height?: number;
};

export default function AnimatedPillTabs<T extends string>({
  options,
  value,
  onChange,
  style,
  width = PILL_TRACK_WIDTH,
  activeWidth = PILL_ACTIVE_WIDTH,
  height = PILL_TRACK_HEIGHT,
}: AnimatedPillTabsProps<T>) {
  const [left, right] = options;
  const resultX = width - activeWidth;
  const isRight = value === right.value;

  const translateX = useSharedValue(isRight ? resultX : 0);
  const startX = useSharedValue(0);

  useEffect(() => {
    translateX.value = withSpring(value === right.value ? resultX : 0, SPRING_CONFIG);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only sync when tab value changes
  }, [value, resultX, right.value]);

  const setValue = (next: T) => {
    if (next !== value) onChange(next);
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-8, 8])
    .onStart(() => {
      'worklet';
      startX.value = translateX.value;
    })
    .onUpdate((e) => {
      'worklet';
      const raw = startX.value + e.translationX;
      if (raw < 0) {
        translateX.value = raw * 0.25;
      } else if (raw > resultX) {
        translateX.value = resultX + (raw - resultX) * 0.25;
      } else {
        translateX.value = raw;
      }
    })
    .onEnd((e) => {
      'worklet';
      let nextRight = false;
      if (e.velocityX > 250) {
        nextRight = true;
      } else if (e.velocityX < -250) {
        nextRight = false;
      } else {
        nextRight = translateX.value > resultX / 2;
      }

      const targetX = nextRight ? resultX : 0;
      translateX.value = withSpring(targetX, {
        ...SPRING_CONFIG,
        velocity: e.velocityX,
      });
      runOnJS(setValue)(nextRight ? right.value : left.value);
    });

  const tapGesture = Gesture.Tap()
    .maxDuration(250)
    .onEnd((e) => {
      'worklet';
      const nextRight = e.x >= activeWidth;
      const targetX = nextRight ? resultX : 0;
      translateX.value = withSpring(targetX, SPRING_CONFIG);
      runOnJS(setValue)(nextRight ? right.value : left.value);
    });

  const pillGesture = Gesture.Race(panGesture, tapGesture);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const leftTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(translateX.value, [0, resultX], ['#113E55', '#878686']),
  }));

  const rightTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(translateX.value, [0, resultX], ['#878686', '#113E55']),
  }));

  return (
    <GestureDetector gesture={pillGesture}>
      <View style={[styles.track, { width, height, borderRadius: height / 2 }, style]}>
        <Animated.View
          style={[
            styles.indicator,
            {
              width: activeWidth,
              height,
              borderRadius: height / 2,
            },
            indicatorStyle,
          ]}
        />
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: value === left.value }}
          onPress={() => {
            translateX.value = withSpring(0, SPRING_CONFIG);
            setValue(left.value);
          }}
          style={[styles.tab, { width: activeWidth, height }]}
        >
          <Animated.Text allowFontScaling={false} style={[styles.label, leftTextStyle]}>
            {left.label}
          </Animated.Text>
        </Pressable>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: value === right.value }}
          onPress={() => {
            translateX.value = withSpring(resultX, SPRING_CONFIG);
            setValue(right.value);
          }}
          style={[styles.tab, { width: resultX, height }]}
        >
          <Animated.Text allowFontScaling={false} style={[styles.label, rightTextStyle]}>
            {right.label}
          </Animated.Text>
        </Pressable>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: '#EFF1F1',
    overflow: 'hidden',
    flexDirection: 'row',
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#CEE5ED',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  label: {
    fontFamily: 'Inter_18pt-Regular',
    fontSize: 11.2,
    lineHeight: 11.2,
    textAlign: 'center',
  },
});
