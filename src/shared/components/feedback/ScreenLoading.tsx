import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const DOTS = 8;
const RING = 64;
const RADIUS = 22;

/** Tail to head. Rotation makes the darker dots chase around the ring. */
const STEPS = [
  { size: 7, color: '#D5E0E8' },
  { size: 7, color: '#C3D3DE' },
  { size: 8, color: '#A9C0CF' },
  { size: 8, color: '#86A8BC' },
  { size: 9, color: '#5E869E' },
  { size: 10, color: '#3A6782' },
  { size: 11, color: '#1E4E68' },
  { size: 12, color: '#113E55' },
];

const LIGHT_STEPS = [
  { size: 7, color: 'rgba(246,247,247,0.28)' },
  { size: 7, color: 'rgba(246,247,247,0.38)' },
  { size: 8, color: 'rgba(246,247,247,0.48)' },
  { size: 8, color: 'rgba(246,247,247,0.58)' },
  { size: 9, color: 'rgba(246,247,247,0.7)' },
  { size: 10, color: 'rgba(246,247,247,0.82)' },
  { size: 11, color: 'rgba(246,247,247,0.92)' },
  { size: 12, color: '#F6F7F7' },
];

/** Orbiting-dot ring. `size` is the ring diameter; dots scale with it. */
export function CircleLoader({
  size = RING,
  tone = 'navy',
}: {
  size?: number;
  /** `light` is for navy and other dark buttons. */
  tone?: 'navy' | 'light';
}) {
  const turn = useSharedValue(0);
  const scale = size / RING;
  const steps = tone === 'light' ? LIGHT_STEPS : STEPS;

  useEffect(() => {
    turn.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.linear }), -1, false);
  }, [turn]);

  const spin = useAnimatedStyle(() => ({
    transform: [{ rotate: `${turn.value * 360}deg` }],
  }));

  return (
    <Animated.View
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
      style={[{ width: size, height: size }, spin]}
    >
      {steps.map((dot, index) => {
        const angle = (index / DOTS) * Math.PI * 2 - Math.PI / 2;
        const dotSize = dot.size * scale;
        return (
          <View
            key={index}
            style={{
              position: 'absolute',
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: dot.color,
              left: size / 2 + Math.cos(angle) * RADIUS * scale - dotSize / 2,
              top: size / 2 + Math.sin(angle) * RADIUS * scale - dotSize / 2,
            }}
          />
        );
      })}
    </Animated.View>
  );
}

/** Full-height centred loader used while a screen's main content is loading. */
export default function ScreenLoading() {
  return (
    <View className="flex-1 items-center justify-center" style={{ paddingBottom: 96 }}>
      <CircleLoader />
    </View>
  );
}
