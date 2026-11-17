import { useCallback, useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, AppState, Platform } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming } from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  size?: number;
  strokeWidth?: number;
  /** Absolute expiration time in ms */
  expiresAt: number;
  /** Called once when remaining time reaches ZERO */
  onExpire?: () => void;
};

export default function CountdownRing({ size = 90, strokeWidth = 7, expiresAt, onExpire }: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  /** total 60 min */
  const totalSeconds = 60 * 60;

  /** compute starting remaining time ONCE */
  const computeRemaining = useCallback(
    () => Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)),
    [expiresAt]
  );

  const [remainingSeconds, setRemainingSeconds] = useState(computeRemaining);

  /** stable progress shared value */
  const progress = useSharedValue(remainingSeconds / totalSeconds);

  const update = useCallback(() => {
    const secs = computeRemaining();
    setRemainingSeconds(secs);

    progress.value = withTiming(secs / totalSeconds, {
      duration: 800,
    });
  }, [computeRemaining, progress, totalSeconds]);

  useEffect(() => {
    update();

    const interval = setInterval(update, 1000);

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') update();
    });

    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [update]);

  const mins = Math.ceil(remainingSeconds / 60) - 1;

  /** fire once when countdown reaches zero */
  const firedRef = useRef(false);

  // Driven by the seconds, not the display minutes: `mins` already reads 0 with up to 60s left,
  // and callers drop the code on expiry while it can still open the gate.
  const expired = remainingSeconds <= 0;
  useEffect(() => {
    if (expired) {
      if (!firedRef.current) {
        firedRef.current = true;
        onExpire?.();
      }
    } else {
      firedRef.current = false;
    }
  }, [expired, onExpire]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  // ---- color helpers ----
  const ringColor = mins <= 15 ? '#FF3B30' : mins <= 30 ? '#FFA500' : '#46ee6a';
  const ringTextColor = ringColor;
  const bgRingColor = mins <= 15 ? '#ffd6d6' : mins <= 30 ? '#ffeac2' : '#dcfae7';
  const strokeDashoffset = circumference * (1 - remainingSeconds / totalSeconds);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          fill="transparent"
          stroke={bgRingColor}
          cx={cx}
          cy={cy}
          r={radius}
          strokeWidth={strokeWidth}
        />

        {/* Reanimated SVG animation is unreliable on web — use a static dash offset there. */}
        {Platform.OS === 'web' ? (
          <Circle
            fill="transparent"
            stroke={ringColor}
            cx={cx}
            cy={cy}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        ) : (
          <AnimatedCircle
            fill="transparent"
            stroke={ringColor}
            cx={cx}
            cy={cy}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            rotation="-90"
            originX={cx}
            originY={cy}
          />
        )}
      </Svg>

      <View style={styles.centerText}>
        <Text style={[styles.text, { color: ringTextColor }]}>{mins}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerText: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'UbuntuSans',
  },
});
