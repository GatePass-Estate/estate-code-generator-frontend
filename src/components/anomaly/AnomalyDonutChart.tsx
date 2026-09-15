import React, { useEffect, useMemo } from 'react';
import { Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  Easing,
  interpolate,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated';

interface AnomalyDonutChartProps {
  size?: number;
  totalText?: string;
  countText?: string;
  isActive?: boolean;
}

interface TickData {
  index: number;
  order: number;
  x: number;
  y: number;
  angle: number;
  color: string;
}



const TICK_WIDTH = 1.308;
const TICK_HEIGHT = 5.275;

// Colors matching user specs
const COLOR_GUEST = '#113E55';
const COLOR_RESIDENT = '#F46036';
const COLOR_SECURITY = '#1B998B';

const AnimatedTick = ({
  tick,
  progress,
}: {
  tick: TickData;
  progress: SharedValue<number>;
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    if (progress.value >= 1) {
      return {
        opacity: 1,
        transform: [
          { rotate: `${tick.angle}deg` },
          { scaleY: 1 },
        ],
      };
    }
    // Graceful stagger: 60 ticks distributed across 78% of the timeline
    // Each tick has a gentle 22% scale & fade envelope for fluid continuity
    const startFrac = (tick.order / 60) * 0.78;
    const endFrac = startFrac + 0.22;
    const p = interpolate(progress.value, [startFrac, endFrac], [0, 1], Extrapolation.CLAMP);
    return {
      opacity: p,
      transform: [
        { rotate: `${tick.angle}deg` },
        { scaleY: p },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: tick.y,
          left: tick.x,
          width: TICK_WIDTH,
          height: TICK_HEIGHT,
          borderRadius: TICK_WIDTH / 2,
          backgroundColor: tick.color,
        },
        animatedStyle,
      ]}
    />
  );
};

export default function AnomalyDonutChart({
  size = 106,
  totalText = 'TOTAL USERS',
  countText = '50k',
}: AnomalyDonutChartProps) {
  const progress = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    progress.value = 0;
    pulse.value = 1;
    // 200ms delay lets the tab pill switch settle before beginning the 1400ms fluid radial sweep
    progress.value = withDelay(
      200,
      withTiming(
        1,
        {
          duration: 1400,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        },
        (finished) => {
          if (finished) {
            // Subtle breathing pulse smoothly takes over after entrance sweep completes
            pulse.value = withRepeat(
              withTiming(1.025, {
                duration: 1600,
                easing: Easing.inOut(Easing.ease),
              }),
              -1,
              true
            );
          }
        }
      )
    );
  }, [progress, pulse]);

  const ticks = useMemo(() => {
    const center = size / 2;
    const radius = 41.5; // Tick center radius matching track band
    const list: TickData[] = [];

    // 60 tick slots around 360 degrees (6 deg each)
    for (let i = 0; i < 60; i++) {
      let color: string | null = null;
      if (i <= 5) {
        color = COLOR_RESIDENT; // Resident (34% top-right section)
      } else if (i <= 37) {
        color = COLOR_GUEST; // Guest (54% right & bottom section)
      } else if (i === 38) {
        color = null; // Gap at bottom-left
      } else if (i <= 45) {
        color = COLOR_SECURITY; // Security (12% bottom-left section)
      } else {
        color = COLOR_RESIDENT; // Resident (34% top-left section)
      }

      if (!color) continue;

      const angle = i * 6; // clockwise from 12 o'clock
      const rad = (angle * Math.PI) / 180;
      const x = center + radius * Math.sin(rad) - TICK_WIDTH / 2;
      const y = center - radius * Math.cos(rad) - TICK_HEIGHT / 2;

      // Clockwise sweep starting from 9 o'clock (slot 46)
      const order = (i - 46 + 60) % 60;

      list.push({
        index: i,
        order,
        x,
        y,
        angle,
        color,
      });
    }

    return list;
  }, [size]);

  const centerTextStyle = useAnimatedStyle(() => {
    'worklet';
    const opacity = interpolate(progress.value, [0, 0.3, 0.8], [0, 0.2, 1], Extrapolation.CLAMP);
    const scale = interpolate(progress.value, [0, 0.35, 1], [0.85, 0.9, 1], Extrapolation.CLAMP);
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  const chartPulseStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ scale: pulse.value }],
    };
  });

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        },
        chartPulseStyle,
      ]}
    >
      {/* Background Circular Track Band & Inner White Disc */}
      <Svg
        width={size}
        height={size}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={41.5}
          stroke="#EAEFF2"
          strokeWidth={7.0}
          fill="#FFFFFF"
        />
      </Svg>

      {/* 59 Animated Radial Ticks */}
      {ticks.map((t) => (
        <AnimatedTick key={t.index} tick={t} progress={progress} />
      ))}

      {/* Center Label & Count: Neat, petite typography with generous whitespace */}
      <Animated.View
        style={[
          {
            alignItems: 'center',
            justifyContent: 'center',
          },
          centerTextStyle,
        ]}
      >
        <Text
          style={{
            fontFamily: 'Inter_18pt-Regular',
            fontSize: 6.8,
            color: '#878686',
            letterSpacing: 0.3,
            textAlign: 'center',
            lineHeight: 9,
            marginBottom: 1,
          }}
        >
          {totalText}
        </Text>
        <Text
          style={{
            fontFamily: 'UbuntuSans-SemiBold',
            fontSize: 21,
            lineHeight: 23,
            color: '#113E55',
            textAlign: 'center',
          }}
        >
          {countText}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}
