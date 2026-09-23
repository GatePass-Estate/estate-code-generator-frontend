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
  countColor?: string;
  isActive?: boolean;
  residentPercentage?: number;
  guestPercentage?: number;
  securityPercentage?: number;
}

interface TickData {
  index: number;
  order: number;
  x: number;
  y: number;
  angle: number;
  color: string;
}

const DONUT_BASE_SIZE = 99;
const DONUT_WHITE_RADIUS = 32.34;
const DONUT_TICK_HEIGHT = 5.227;
const DONUT_TICK_WIDTH = 1.32;
/** Clear gap between white disc outer edge and tick inner tips */
const WHITE_TO_TICK_GAP = 4;

const COLOR_GUEST = '#F46036';
const COLOR_RESIDENT = '#113E55';
const COLOR_SECURITY = '#1B998B';
const TRACK_COLOR = '#EAEFF2';

const AnimatedTick = ({
  tick,
  progress,
  tickWidth,
  tickHeight,
}: {
  tick: TickData;
  progress: SharedValue<number>;
  tickWidth: number;
  tickHeight: number;
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    if (progress.value >= 1) {
      return {
        opacity: 1,
        transform: [{ rotate: `${tick.angle}deg` }, { scaleY: 1 }],
      };
    }
    const startFrac = (tick.order / 60) * 0.78;
    const endFrac = startFrac + 0.22;
    const p = interpolate(progress.value, [startFrac, endFrac], [0, 1], Extrapolation.CLAMP);
    return {
      opacity: p,
      transform: [{ rotate: `${tick.angle}deg` }, { scaleY: p }],
    };
  });

  return (
    <Animated.View
      className="absolute"
      style={[
        {
          top: tick.y,
          left: tick.x,
          width: tickWidth,
          height: tickHeight,
          borderRadius: tickWidth / 2,
          backgroundColor: tick.color,
        },
        animatedStyle,
      ]}
    />
  );
};

const AnomalyDonutChart = ({
  size = DONUT_BASE_SIZE,
  totalText = 'TOTAL USERS',
  countText = '50k',
  countColor = '#113E55',
  isActive = true,
  residentPercentage = 0,
  guestPercentage = 0,
  securityPercentage = 0,
}: AnomalyDonutChartProps) => {
  const progress = useSharedValue(0);
  const pulse = useSharedValue(1);
  const scale = size / DONUT_BASE_SIZE;

  const whiteRadius = DONUT_WHITE_RADIUS * scale;
  const tickHeight = DONUT_TICK_HEIGHT * scale;
  const tickWidth = DONUT_TICK_WIDTH * scale;
  const gap = WHITE_TO_TICK_GAP * scale;
  // Centerline so inner tip of each tick sits exactly `gap` outside the white disc
  const tickRadius = whiteRadius + gap + tickHeight / 2;
  const trackStroke = gap;
  const trackRadius = whiteRadius + trackStroke / 2;

  useEffect(() => {
    if (!isActive) {
      progress.value = 0;
      pulse.value = 1;
      return;
    }
    progress.value = 0;
    pulse.value = 1;
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
            pulse.value = withRepeat(
              withTiming(1.02, {
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
  }, [isActive, progress, pulse, residentPercentage, guestPercentage, securityPercentage]);

  const ticks = useMemo(() => {
    const center = size / 2;
    const list: TickData[] = [];
    const totalTicks = 59;
    let rTicks = Math.round((residentPercentage / 100) * totalTicks);
    let gTicks = Math.round((guestPercentage / 100) * totalTicks);
    let sTicks = Math.round((securityPercentage / 100) * totalTicks);

    const sum = rTicks + gTicks + sTicks;
    if (sum > 0 && sum !== totalTicks) {
      if (rTicks >= gTicks && rTicks >= sTicks) rTicks += totalTicks - sum;
      else if (gTicks >= rTicks && gTicks >= sTicks) gTicks += totalTicks - sum;
      else sTicks += totalTicks - sum;
    }

    for (let i = 0; i < 60; i++) {
      let color: string | null = null;

      if (i < rTicks) {
        color = COLOR_RESIDENT;
      } else if (i < rTicks + gTicks) {
        color = COLOR_GUEST;
      } else if (i === rTicks + gTicks && sum > 0) {
        color = null;
      } else if (i < rTicks + gTicks + 1 + sTicks) {
        color = COLOR_SECURITY;
      }

      if (!color) continue;

      const angle = i * 6;
      const rad = (angle * Math.PI) / 180;
      const x = center + tickRadius * Math.sin(rad) - tickWidth / 2;
      const y = center - tickRadius * Math.cos(rad) - tickHeight / 2;
      const order = (i - 45 + 60) % 60;

      list.push({ index: i, order, x, y, angle, color });
    }

    return list;
  }, [
    size,
    tickRadius,
    tickWidth,
    tickHeight,
    residentPercentage,
    guestPercentage,
    securityPercentage,
  ]);

  const centerTextStyle = useAnimatedStyle(() => {
    'worklet';
    const opacity = interpolate(progress.value, [0, 0.3, 0.8], [0, 0.2, 1], Extrapolation.CLAMP);
    return { opacity };
  });

  const chartPulseStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ scale: pulse.value }],
    };
  });

  return (
    <Animated.View
      className="relative items-center justify-center"
      style={[{ width: size, height: size }, chartPulseStyle]}
    >
      <Svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0 }}>
        <Circle cx={size / 2} cy={size / 2} r={whiteRadius} fill="#FFFFFF" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={trackRadius}
          stroke={TRACK_COLOR}
          strokeWidth={trackStroke}
          fill="none"
        />
      </Svg>

      {ticks.map((t) => (
        <AnimatedTick
          key={t.index}
          tick={t}
          progress={progress}
          tickWidth={tickWidth}
          tickHeight={tickHeight}
        />
      ))}

      <Animated.View
        className="items-center justify-center"
        style={[centerTextStyle, { transform: [{ translateY: 4 }] }]}
      >
        <Text
    
          className="text-center text-[6.8px] font-inter-light leading-[6.8px] tracking-[0.3px] text-[#878686]"
        >
          {totalText}
        </Text>
        <Text
     
          className="mt-0.5 text-center text-[21.88px] font-ubuntu-semibold leading-[21.88px]"
          style={{ color: countColor }}
        >
          {countText}
        </Text>
      </Animated.View>
    </Animated.View>
  );
};

export default React.memo(AnomalyDonutChart);
