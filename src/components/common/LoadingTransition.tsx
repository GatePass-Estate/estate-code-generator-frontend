import images from '@/src/constants/images';
import { View, Animated, Easing, Platform } from 'react-native';
import { useEffect, useRef } from 'react';

const LoadingTransition = () => {
	const scaleAnim = useRef(new Animated.Value(1)).current;

	useEffect(() => {
		const pulse = Animated.sequence([
			Animated.timing(scaleAnim, {
				toValue: 1.1,
				duration: 1000,
				easing: Easing.bezier(0.4, 0, 0.2, 1),
				useNativeDriver: true,
			}),
			Animated.timing(scaleAnim, {
				toValue: 1,
				duration: 1000,
				easing: Easing.bezier(0.4, 0, 0.2, 1),
				useNativeDriver: true,
			}),
		]);

		Animated.loop(pulse).start();

		return () => {
			scaleAnim.stopAnimation();
		};
	}, []);

	useEffect(() => {
		if (Platform.OS === 'web') document.title = 'Loading - GatePass';
	}, []);

	return (
		<View style={{ flex: 1 }} className="items-center justify-center p-6 security-bg">
			<Animated.Image
				source={images.logo}
				style={[
					{
						width: 200,
						height: 200,
						transform: [{ scale: scaleAnim }],
					},
				]}
			/>
		</View>
	);
};

export default LoadingTransition;
