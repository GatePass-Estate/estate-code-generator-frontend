import { useEffect, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { Inter } from '@/src/constants/fonts';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Figma 5122:3832 / 5123:2361 — Ellipse 41+42 annulus (#F1F8FB @ 0.6 + 0.3) */
const FROZEN_RING_PATH =
  'M70.9997 35.4998C70.9997 55.1059 55.1059 70.9997 35.4998 70.9997C15.8938 70.9997 0 55.1059 0 35.4998C0 15.8938 15.8938 0 35.4998 0C55.1059 0 70.9997 15.8938 70.9997 35.4998ZM5.67998 35.4998C5.67998 51.9689 19.0308 65.3197 35.4998 65.3197C51.9689 65.3197 65.3197 51.9689 65.3197 35.4998C65.3197 19.0308 51.9689 5.67998 35.4998 5.67998C19.0308 5.67998 5.67998 19.0308 5.67998 35.4998Z';

const FROZEN_TEXT = 'rgba(241, 248, 251, 0.6)';

type Props = {
  size?: number;
  strokeWidth?: number;
  /** When the validity period started, in ms epoch. Falls back to "now" on mount. */
  startAt?: number | null;
  /** When the code expires, in ms epoch. */
  expiresAt: number;
  dimmed?: boolean;
};

export default function AccessCodeRing({
  size = 71,
  strokeWidth = 5.7,
  startAt = null,
  expiresAt,
  dimmed = false,
}: Props) {
  const ringStroke = dimmed ? 5.68 : strokeWidth;
  const radius = (size - ringStroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const scale = size / 71;

  const computeRemaining = () => Math.max(0, expiresAt - Date.now());

  const totalMsRef = useRef(
    startAt != null ? Math.max(expiresAt - startAt, 1) : Math.max(computeRemaining(), 1)
  );

  const [remainingMs, setRemainingMs] = useState(computeRemaining);
  const progress = useSharedValue(Math.min(1, remainingMs / totalMsRef.current));

  useEffect(() => {
    const update = () => {
      const remaining = computeRemaining();
      setRemainingMs(remaining);
      progress.value = withTiming(Math.min(1, remaining / totalMsRef.current), { duration: 500 });
    };

    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt]);

  const totalMinutes = Math.floor(remainingMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const timeLabel = `${hours} : ${String(minutes).padStart(2, '0')}`;

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const textColor = dimmed ? FROZEN_TEXT : '#113E55';
  const labelColor = dimmed ? FROZEN_TEXT : '#9B9797';

  return (
    <View style={{ width: size, height: size }}>
      {dimmed ? (
        <Svg width={size} height={size} viewBox="0 0 71 71" style={{ position: 'absolute' }}>
          <Path d={FROZEN_RING_PATH} fill="#F1F8FB" fillOpacity={0.6} />
          <Path d={FROZEN_RING_PATH} fill="#F1F8FB" fillOpacity={0.3} />
        </Svg>
      ) : (
        <Svg width={size} height={size} style={{ position: 'absolute' }}>
          <Circle
            fill="transparent"
            stroke="#CEE5ED"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={ringStroke}
          />
          <AnimatedCircle
            fill="transparent"
            stroke="#46EE6A"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={ringStroke}
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            rotation="-90"
            originX={size / 2}
            originY={size / 2}
          />
          <AnimatedCircle
            fill="transparent"
            stroke="rgba(0, 0, 0, 0.20)"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={ringStroke}
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            rotation="-90"
            originX={size / 2}
            originY={size / 2}
          />
        </Svg>
      )}

      {/* Figma 5122:3835 — ExtraBold 14.5, centered at (36.09, 35.27) */}
      <Text
        style={{
          position: 'absolute',
          left: 6.56 * scale,
          top: 29.53 * scale,
          width: 59.06 * scale,
          fontFamily: Inter.extraBold,
          fontSize: 14.5 * scale,
          lineHeight: 16 * scale,
          color: textColor,
          textAlign: 'center',
          includeFontPadding: false,
        }}
      >
        {timeLabel}
      </Text>

      {/* Figma 5122:3836 — Bold 5px, center (21.95, 45.5) */}
      <Text
        style={{
          position: 'absolute',
          left: 12.45 * scale,
          top: 43 * scale,
          width: 19 * scale,
          fontFamily: Inter.bold,
          fontSize: 5 * scale,
          lineHeight: 7 * scale,
          color: labelColor,
          textAlign: 'center',
          includeFontPadding: false,
        }}
      >
        HOUR
      </Text>

      {/* Figma 5122:3837 — Bold 5px, center (50.95, 45.5) */}
      <Text
        style={{
          position: 'absolute',
          left: 41.45 * scale,
          top: 43 * scale,
          width: 19 * scale,
          fontFamily: Inter.bold,
          fontSize: 5 * scale,
          lineHeight: 7 * scale,
          color: labelColor,
          textAlign: 'center',
          includeFontPadding: false,
        }}
      >
        MINS
      </Text>
    </View>
  );
}
