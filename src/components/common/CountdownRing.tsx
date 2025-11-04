import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, AppState } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming } from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type CountdownRingProps = {
	totalMinutes?: number;
	initialMinutes?: number;

	size?: number;
	strokeWidth?: number;
};

const CountdownRing = ({ totalMinutes = 60, initialMinutes, size = 90, strokeWidth = 7 }: CountdownRingProps) => {
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;

	const totalSeconds = totalMinutes * 60;
	const startSeconds = Math.min((initialMinutes ?? totalMinutes) * 60, totalSeconds);

	const [remainingSeconds, setRemainingSeconds] = useState(startSeconds);
	const progress = useSharedValue(startSeconds / totalSeconds);

	const startTimeRef = React.useRef(Date.now() - (totalSeconds - startSeconds) * 1000);

	const updateCountdown = () => {
		const now = Date.now();
		const elapsedSec = Math.floor((now - startTimeRef.current) / 1000);
		const remainingSec = Math.max(0, totalSeconds - elapsedSec);

		setRemainingSeconds(remainingSec);
		progress.value = withTiming(remainingSec / totalSeconds, { duration: 800 });

		if (remainingSec <= 0) {
			// optional: auto-restart
			startTimeRef.current = now;
			setRemainingSeconds(totalSeconds);
			progress.value = withTiming(1, { duration: 500 });
		}
	};

	useEffect(() => {
		updateCountdown();

		const minuteInterval = 60_000; // 1 minute
		const intervalId = setInterval(updateCountdown, minuteInterval);

		const sub = AppState.addEventListener('change', (nextState) => {
			if (nextState === 'active') updateCountdown();
		});

		return () => {
			clearInterval(intervalId);
			sub.remove();
		};
	}, [totalSeconds]);

	const animatedProps = useAnimatedProps(() => ({
		strokeDashoffset: circumference * (1 - progress.value),
	}));

	const remainingMinutes = Math.ceil(remainingSeconds / 60);

	const getRingColor = () => {
		if (remainingMinutes <= 15) return '#FF3B30';
		if (remainingMinutes <= 30) return '#FFA500';
		return '#46ee6a';
	};

	const getRingTextColor = () => {
		if (remainingMinutes <= 15) return '#FF3B30';
		if (remainingMinutes <= 30) return '#FFA500';
		return '#113E55';
	};

	const getBackgroundRingColor = () => {
		if (remainingMinutes <= 15) return '#ffd6d6';
		if (remainingMinutes <= 30) return '#ffeac2';
		return '#dcfae7';
	};

	return (
		<View style={{ width: size, height: size }}>
			<Svg width={size} height={size}>
				{/* background ring */}
				<Circle fill="transparent" stroke={getBackgroundRingColor()} cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} />

				{/* animated arc */}
				<AnimatedCircle fill="transparent" stroke={getRingColor()} cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} strokeLinecap="butt" strokeDasharray={circumference} animatedProps={animatedProps} rotation="90" originX={size / 2} originY={size / 2} />
			</Svg>

			{/* minutes text */}
			<View style={styles.centerText}>
				<Text style={[styles.text, { color: getRingTextColor() }]}>{remainingMinutes}</Text>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	centerText: {
		position: 'absolute',
		top: 0,
		left: 0,
		width: '100%',
		height: '100%',
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: 10,
	},
	text: {
		fontSize: 20,
		fontWeight: 'bold',
		fontFamily: 'UbuntuSans',
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 6,
	},
});

export default CountdownRing;
