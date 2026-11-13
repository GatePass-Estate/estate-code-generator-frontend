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
  /** Optional override for the center count text. */
  countColor?: string;
  /** Optional override for the whole tick ring color. */
  ringColor?: string;
  isActive?: boolean;
  residentPercentage?: number;
  guestPercentage?: number;
  securityPercentage?: number;
  /** Prefer counts over percentages when picking the dominant ring color. */
  residentCount?: number;
  guestCount?: number;
  securityCount?: number;
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
/** Design authored at 106×106 (Figma 6355:2809 scales to ~99). */
const DESIGN_SIZE = 106;
const TICK_RADIUS_AT_DESIGN = 41.5;
/**
 * Figma rings (outside → in):
 * 1. White outer — substrate the progress ticks sit on
 * 2. Gray track — inset ~13.33% (node 6355:2810)
 * 3. White inner — inset ~17.33% (node 6355:2868)
 */
const GRAY_TRACK_RADIUS_RATIO = 0.5 - 0.1333; // ~0.3667
const WHITE_INNER_RADIUS_RATIO = 0.5 - 0.1733; // ~0.3267

// Colors matching the right-side legend (Guest / Resident / Security)
const COLOR_GUEST = '#F46036';
const COLOR_RESIDENT = '#113E55';
const COLOR_SECURITY = '#1B998B';
const COLOR_COUNT_DEFAULT = '#04162D';
const COLOR_TRACK = '#F8F8F8';
const COLOR_WHITE = '#FFFFFF';

function dominantLegendColor(segments: { value: number; color: string }[]): string {
  let best = segments[0];
  for (let i = 1; i < segments.length; i++) {
    if (segments[i].value > best.value) best = segments[i];
  }
  return best.value > 0 ? best.color : COLOR_RESIDENT;
}

const AnimatedTick = ({
  tick,
  progress,
  width,
  height,
}: {
  tick: TickData;
  progress: SharedValue<number>;
  width: number;
  height: number;
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    if (progress.value >= 1) {
      return {
        opacity: 1,
        transform: [{ rotate: `${tick.angle}deg` }, { scaleY: 1 }],
      };
    }
    // Graceful stagger: 60 ticks distributed across 78% of the timeline
    // Each tick has a gentle 22% scale & fade envelope for fluid continuity
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
      style={[
        {
          position: 'absolute',
          top: tick.y,
          left: tick.x,
          width,
          height,
          borderRadius: width / 2,
          backgroundColor: tick.color,
        },
        animatedStyle,
      ]}
    />
  );
};

const AnomalyDonutChart = ({
  size = 106,
  totalText = 'TOTAL USERS',
  countText = '50k',
  countColor,
  ringColor: ringColorOverride,
  residentPercentage = 0,
  guestPercentage = 0,
  securityPercentage = 0,
  residentCount,
  guestCount,
  securityCount,
}: AnomalyDonutChartProps) => {
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

  const scale = size / DESIGN_SIZE;
  const tickRadius = TICK_RADIUS_AT_DESIGN * scale;
  const grayTrackRadius = size * GRAY_TRACK_RADIUS_RATIO;
  const whiteInnerRadius = size * WHITE_INNER_RADIUS_RATIO;
  const tickW = TICK_WIDTH * scale;
  const tickH = TICK_HEIGHT * scale;

  const ticks = useMemo(() => {
    const center = size / 2;
    const list: TickData[] = [];

    // Calculate tick counts based on percentages (full 60-tick ring)
    const totalTicks = 60;
    let rTicks = Math.round((residentPercentage / 100) * totalTicks);
    let gTicks = Math.round((guestPercentage / 100) * totalTicks);
    let sTicks = Math.round((securityPercentage / 100) * totalTicks);

    const sum = rTicks + gTicks + sTicks;
    if (sum > 0 && sum !== totalTicks) {
      if (rTicks >= gTicks && rTicks >= sTicks) rTicks += totalTicks - sum;
      else if (gTicks >= rTicks && gTicks >= sTicks) gTicks += totalTicks - sum;
      else sTicks += totalTicks - sum;
    }

    // Optional single ring color (e.g. anomaly dominant). Otherwise segment colors.
    const unified =
      ringColorOverride ??
      (residentCount != null || guestCount != null || securityCount != null
        ? dominantLegendColor([
            { value: residentCount ?? 0, color: COLOR_RESIDENT },
            { value: guestCount ?? 0, color: COLOR_GUEST },
            { value: securityCount ?? 0, color: COLOR_SECURITY },
          ])
        : null);

    for (let i = 0; i < totalTicks; i++) {
      let color: string | null = null;

      if (i < rTicks) {
        color = unified ?? COLOR_RESIDENT;
      } else if (i < rTicks + gTicks) {
        color = unified ?? COLOR_GUEST;
      } else if (i < rTicks + gTicks + sTicks) {
        color = unified ?? COLOR_SECURITY;
      }

      if (!color) continue;

      const angle = i * 6; // clockwise from 12 o'clock
      const rad = (angle * Math.PI) / 180;
      const x = center + tickRadius * Math.sin(rad) - tickW / 2;
      const y = center - tickRadius * Math.cos(rad) - tickH / 2;

      // Clockwise sweep starting from 9 o'clock (slot 45)
      const order = (i - 45 + 60) % 60;

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
  }, [
    size,
    tickRadius,
    tickW,
    tickH,
    residentPercentage,
    guestPercentage,
    securityPercentage,
    ringColorOverride,
    residentCount,
    guestCount,
    securityCount,
  ]);

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
      {/*
        Figma 6355:2809 layers (outside → in):
        white outer (gauge base) → gray track → white inner
      */}
      <Svg
        width={size}
        height={size}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        {/* 1. White outer — where the progress ticks sit */}
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={COLOR_WHITE} />
        {/* 2. Gray track ring disc */}
        <Circle cx={size / 2} cy={size / 2} r={grayTrackRadius} fill={COLOR_TRACK} />
        {/* 3. White inner disc */}
        <Circle cx={size / 2} cy={size / 2} r={whiteInnerRadius} fill={COLOR_WHITE} />
      </Svg>

      {/* 59 Animated Radial Ticks */}
      {ticks.map((t) => (
        <AnimatedTick key={t.index} tick={t} progress={progress} width={tickW} height={tickH} />
      ))}

      {/* Center: TOTAL REPORT above count (Figma Inter Light + Ubuntu Sans SemiBold) */}
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
          allowFontScaling={false}
          style={{
            fontFamily: 'Inter_18pt-Light',
            fontSize: 6.8 * scale,
            color: '#878686',
            textAlign: 'center',
            lineHeight: 8 * scale,
            marginBottom: 1 * scale,
          }}
        >
          {totalText}
        </Text>
        <Text
          allowFontScaling={false}
          style={{
            fontFamily: 'UbuntuSans-SemiBold',
            fontSize: 21.88 * scale,
            lineHeight: 23 * scale,
            color: countColor || COLOR_COUNT_DEFAULT,
            textAlign: 'center',
          }}
        >
          {countText}
        </Text>
      </Animated.View>
    </Animated.View>
  );
};

export default React.memo(AnomalyDonutChart);
