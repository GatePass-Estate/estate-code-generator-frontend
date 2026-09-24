import { useEffect, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE = 71;
const STROKE = 5.7;
const FROZEN_STROKE = 5.68;
const RADIUS = (SIZE - STROKE) / 2;
const FROZEN_RADIUS = (SIZE - FROZEN_STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const FROZEN_RING_PATH =
  'M70.9997 35.4998C70.9997 55.1059 55.1059 70.9997 35.4998 70.9997C15.8938 70.9997 0 55.1059 0 35.4998C0 15.8938 15.8938 0 35.4998 0C55.1059 0 70.9997 15.8938 70.9997 35.4998ZM5.67998 35.4998C5.67998 51.9689 19.0308 65.3197 35.4998 65.3197C51.9689 65.3197 65.3197 51.9689 65.3197 35.4998C65.3197 19.0308 51.9689 5.67998 35.4998 5.67998C19.0308 5.67998 5.67998 19.0308 5.67998 35.4998Z';

type Props = {
  /** When the validity period started, in ms epoch. Falls back to "now" on mount. */
  startAt?: number | null;
  /** When the code expires, in ms epoch. */
  expiresAt: number;
  dimmed?: boolean;
};

export default function AccessCodeRing({ startAt = null, expiresAt, dimmed = false }: Props) {
  const stroke = dimmed ? FROZEN_STROKE : STROKE;
  const radius = dimmed ? FROZEN_RADIUS : RADIUS;
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
  const timeLabel = `${hours} : ${String(minutes).padStart(2, '0')}`;

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const timeClass = dimmed
    ? 'absolute left-[7px] top-[28px] w-[59px] text-center font-inter-extrabold text-[14.5px] leading-[14px] text-[#F1F8FB]/60'
    : 'absolute left-[7px] top-[28px] w-[59px] text-center font-inter-extrabold text-[14.5px] leading-[14px] text-[#113E55]';

  const labelClass = dimmed
    ? 'absolute top-[41px] w-[19px] text-center font-inter-semibold text-[5px] leading-[7px] text-[#F1F8FB]/60'
    : 'absolute top-[41px] w-[19px] text-center font-inter-semibold text-[5px] leading-[7px] text-[#9B9797]';

  return (
    <View className="h-[71px] w-[71px]">
      {dimmed ? (
        <Svg width={SIZE} height={SIZE} viewBox="0 0 71 71" className="absolute">
          <Path d={FROZEN_RING_PATH} fill="#F1F8FB" fillOpacity={0.6} />
          <Path d={FROZEN_RING_PATH} fill="#F1F8FB" fillOpacity={0.3} />
        </Svg>
      ) : (
        <Svg width={SIZE} height={SIZE} className="absolute">
          <Circle
            fill="transparent"
            stroke="#CEE5ED"
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={radius}
            strokeWidth={stroke}
          />
          <AnimatedCircle
            fill="transparent"
            stroke="#46EE6A"
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={radius}
            strokeWidth={stroke}
            strokeDasharray={CIRCUMFERENCE}
            animatedProps={animatedProps}
            rotation="-90"
            originX={SIZE / 2}
            originY={SIZE / 2}
          />
          <AnimatedCircle
            fill="transparent"
            stroke="rgba(0, 0, 0, 0.20)"
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={radius}
            strokeWidth={stroke}
            strokeDasharray={CIRCUMFERENCE}
            animatedProps={animatedProps}
            rotation="-90"
            originX={SIZE / 2}
            originY={SIZE / 2}
          />
        </Svg>
      )}

      <Text className={timeClass}>{timeLabel}</Text>
      <Text className={`${labelClass} left-[12px]`}>HOUR</Text>
      <Text className={`${labelClass} left-[41px]`}>MINS</Text>
    </View>
  );
}
