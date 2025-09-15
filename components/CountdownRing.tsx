import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, AppState } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const CountdownRing = ({ size = 90, strokeWidth = 7, storageKey = 'countdownStart' }) => {
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;

	const [remainingMinutes, setRemainingMinutes] = useState(60);
	const progress = useSharedValue(1); // 1 = full circle

	const saveStartTime = async () => {
		const now = Date.now();
		await AsyncStorage.setItem(storageKey, now.toString());
	};

	const loadRemainingTime = async () => {
		const saved = await AsyncStorage.getItem(storageKey);
		const now = Date.now();

		if (saved) {
			const elapsed = Math.floor((now - parseInt(saved)) / 15); // in seconds
			const remaining = 3600 - elapsed;

			if (remaining <= 0) {
				// Restart timer if it reached zero
				await saveStartTime();
				setRemainingMinutes(60);
				progress.value = withTiming(1, { duration: 500 });
			} else {
				const minutes = Math.max(0, Math.ceil(remaining / 60));
				setRemainingMinutes(minutes);
				progress.value = withTiming(remaining / 3600, { duration: 800 });
			}
		} else {
			await saveStartTime();
		}
	};

	useEffect(() => {
		// loadRemainingTime();

		const interval = setInterval(loadRemainingTime, 1000);
		const sub = AppState.addEventListener('change', (state) => {
			if (state === 'active') loadRemainingTime();
		});

		return () => {
			if (interval) clearInterval(interval);
			sub.remove();
		};
	}, []);

	const animatedProps = useAnimatedProps(() => ({
		strokeDashoffset: circumference * (1 - progress.value),
	}));

	const getRingColor = () => {
		if (remainingMinutes <= 15) return '#FF3B30'; // red
		if (remainingMinutes <= 30) return '#FFA500'; // orange
		return '#46ee6a'; // green
	};

	const getBackgroundRingColor = () => {
		if (remainingMinutes <= 15) return '#ffd6d6'; // Light red
		if (remainingMinutes <= 30) return '#ffeac2'; // Light orange
		return '#dcfae7'; // Light green
	};

	const getTextColor = () => {
		return remainingMinutes <= 15 ? '#FF3B30' : '#113E55';
	};

	return (
		<View style={{ width: size, height: size }}>
			<Svg width={size} height={size}>
				{/* Background ring with same stroke width */}
				<Circle
					fill="transparent"
					stroke={getBackgroundRingColor()} // ← dynamic background color
					cx={size / 2}
					cy={size / 2}
					r={radius}
					strokeWidth={strokeWidth}
				/>

				{/* Animated countdown arc */}
				<AnimatedCircle fill="transparent" stroke={getRingColor()} cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} strokeLinecap="butt" strokeDasharray={circumference} animatedProps={animatedProps} rotation="90" originX={size / 2} originY={size / 2} />
			</Svg>

			{/* Countdown text */}
			<View style={styles.centerText}>
				<Text style={[styles.text, { color: getTextColor() }]}>{remainingMinutes}</Text>
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
		backgroundColor: '#FFFFFF',
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 6,
	},
});

export default CountdownRing;
