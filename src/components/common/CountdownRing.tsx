import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, AppState } from 'react-native';
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

	/** total 60 min */
	const totalSeconds = 60 * 60;

	/** compute starting remaining time ONCE */
	const computeRemaining = () => Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));

	const [remainingSeconds, setRemainingSeconds] = useState(computeRemaining);

	/** stable progress shared value */
	const progress = useSharedValue(remainingSeconds / totalSeconds);

	/** keep stable reference to expiration */
	const expiresRef = useRef(expiresAt);

	const update = () => {
		const secs = computeRemaining();
		setRemainingSeconds(secs);

		progress.value = withTiming(secs / totalSeconds, {
			duration: 800,
		});
	};

	useEffect(() => {
		update();

		const interval = setInterval(update, 1000); // update every second

		const sub = AppState.addEventListener('change', (state) => {
			if (state === 'active') update();
		});

		return () => {
			clearInterval(interval);
			sub.remove();
		};
	}, []); //

	const mins = Math.ceil(remainingSeconds / 60);

	/** fire once when countdown reaches zero */
	const firedRef = useRef(false);

	useEffect(() => {
		if (mins <= 0) {
			if (!firedRef.current) {
				firedRef.current = true;
				onExpire?.();
			}
		} else {
			firedRef.current = false;
		}
	}, [mins, onExpire]);

	const animatedProps = useAnimatedProps(() => ({
		strokeDashoffset: circumference * (1 - progress.value),
	}));

	// ---- color helpers ----
	const ringColor = mins <= 15 ? '#FF3B30' : mins <= 30 ? '#FFA500' : '#46ee6a';
	const ringTextColor = ringColor;
	const bgRingColor = mins <= 15 ? '#ffd6d6' : mins <= 30 ? '#ffeac2' : '#dcfae7';

	return (
		<View style={{ width: size, height: size }}>
			<Svg width={size} height={size}>
				<Circle fill="transparent" stroke={bgRingColor} cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} />

				<AnimatedCircle fill="transparent" stroke={ringColor} cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} strokeDasharray={circumference} animatedProps={animatedProps} rotation="90" originX={size / 2} originY={size / 2} />
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
