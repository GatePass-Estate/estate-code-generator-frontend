import { useEffect, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

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
  const radius = (size - strokeWidth) / 2;
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

  const trackColor = dimmed ? 'rgba(246,247,247,0.35)' : '#CEE5ED';
  const progressColor = dimmed ? 'rgba(246,247,247,0.6)' : '#46EE6A';
  const textColor = dimmed ? 'rgba(241,248,251,0.6)' : '#113E55';
  const labelColor = dimmed ? 'rgba(241,248,251,0.6)' : '#9B9797';

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          fill="transparent"
          stroke={trackColor}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <AnimatedCircle
          fill="transparent"
          stroke={progressColor}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          rotation="-90"
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>

      <View style={{ alignItems: 'center', width: size * 0.83 }}>
        <Text
          className="font-inter-semibold"
          style={{ fontSize: 13, color: textColor }}
        >{`${hours} : ${String(minutes).padStart(2, '0')}`}</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
          <Text style={{ fontSize: 5, fontWeight: '700', color: labelColor }}>HOUR</Text>
          <Text style={{ fontSize: 5, fontWeight: '700', color: labelColor }}>MINS</Text>
        </View>
      </View>
    </View>
  );
}
