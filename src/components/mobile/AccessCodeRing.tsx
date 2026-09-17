import { useEffect, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { Inter } from '@/src/constants/fonts';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Figma 5123:2361 Ellipse 41/42 — same annulus path stacked at 60% + 30%
 * opacity (≈72% combined), used instead of an animated progress stroke when frozen. */
const FROZEN_RING_PATH =
  'M70.9997 35.4998C70.9997 55.1059 55.1059 70.9997 35.4998 70.9997C15.8938 70.9997 0 55.1059 0 35.4998C0 15.8938 15.8938 0 35.4998 0C55.1059 0 70.9997 15.8938 70.9997 35.4998ZM5.67998 35.4998C5.67998 51.9689 19.0308 65.3197 35.4998 65.3197C51.9689 65.3197 65.3197 51.9689 65.3197 35.4998C65.3197 19.0308 51.9689 5.67998 35.4998 5.67998C19.0308 5.67998 5.67998 19.0308 5.67998 35.4998Z';

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

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  // Frozen (5165:5472): frosted #F1F8FB rings instead of green
  const trackColor = dimmed ? 'rgba(241, 248, 251, 0.3)' : '#CEE5ED';
  const progressColor = dimmed ? 'rgba(241, 248, 251, 0.6)' : '#46EE6A';
  const progressOverlay = 'rgba(0, 0, 0, 0.20)';
  const textColor = dimmed ? 'rgba(241, 248, 251, 0.6)' : '#113E55';
  const labelColor = dimmed ? 'rgba(241, 248, 251, 0.6)' : '#9B9797';

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        {dimmed ? (
          <>
            {/* Figma Ellipse 41 @ 0.6 + Ellipse 42 @ 0.3 */}
            <Path d={FROZEN_RING_PATH} fill="#F1F8FB" fillOpacity={0.6} />
            <Path d={FROZEN_RING_PATH} fill="#F1F8FB" fillOpacity={0.3} />
          </>
        ) : (
          <>
            <Circle
              fill="transparent"
              stroke={trackColor}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={ringStroke}
            />
            <AnimatedCircle
              fill="transparent"
              stroke={progressColor}
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
            {/* Figma: linear-gradient(0deg, rgba(0,0,0,0.20), rgba(0,0,0,0.20)), #46EE6A */}
            <AnimatedCircle
              fill="transparent"
              stroke={progressOverlay}
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
          </>
        )}
      </Svg>

      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center' }}>
        {/* Hours Column */}
        <View style={{ alignItems: 'center', gap: 2 }}>
          <Text
            style={{
              fontFamily: Inter.semiBold,
              fontSize: dimmed ? 14.5 : 13,
              color: textColor,
              textAlign: 'center',
              lineHeight: 14,
            }}
          >
            {hours}
          </Text>
          <Text
            style={{
              fontFamily: Inter.semiBold,
              fontSize: 5,
              color: labelColor,
              textAlign: 'center',
            }}
          >
            HOUR
          </Text>
        </View>

        {/* Colon */}
        <Text
          style={{
            fontFamily: Inter.semiBold,
            fontSize: dimmed ? 14.5 : 13,
            color: textColor,
            textAlign: 'center',
            lineHeight: 14,
          }}
        >
          :
        </Text>

        {/* Minutes Column */}
        <View style={{ alignItems: 'center', gap: 2 }}>
          <Text
            style={{
              fontFamily: Inter.semiBold,
              fontSize: dimmed ? 14.5 : 13,
              color: textColor,
              textAlign: 'center',
              lineHeight: 14,
            }}
          >
            {String(minutes).padStart(2, '0')}
          </Text>
          <Text
            style={{
              fontFamily: Inter.semiBold,
              fontSize: 5,
              color: labelColor,
              textAlign: 'center',
            }}
          >
            MINS
          </Text>
        </View>
      </View>
    </View>
  );
}
