import { Stack, router } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import CountdownRing from '@/src/components/common/CountdownRing';
import { View, Text, FlatList, Animated, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import UserIcon from '@/src/components/mobile/UserIcon';
import { useEffect, useRef, useState } from 'react';
import images from '@/src/constants/images';
import { Codes } from '@/src/types/codes';
import { getAllCodes } from '@/src/lib/api/codes';
import { useUserStore } from '@/src/lib/stores/userStore';
import { sharedStyles } from '@/src/theme/styles';
import { isDataEqual } from '@/src/lib/helpers';
import CodeItem from '@/src/components/mobile/CodeItem';

export default function HomeMobile({}) {
	const bounceValue = useRef(new Animated.Value(0)).current;
	const [refreshing, setRefreshing] = useState(true);
	const [codes, setCodes] = useState<Codes[]>([]);
	const navigation = useNavigation();
	const codesRef = useRef<Codes[]>(codes);

	// Keep ref in sync with state
	useEffect(() => {
		codesRef.current = codes;
	}, [codes]);

	const fetchCodes = async (showLoading = true) => {
		if (showLoading) setRefreshing(true);
		try {
			const result = await getAllCodes(useUserStore.getState().user_id);
			const newCodes = result.items.filter((code) => !code.is_expired);
			if (!isDataEqual(newCodes, codesRef.current)) {
				setCodes(newCodes);
			}
		} catch (error) {
			console.log('Failed to fetch codes:', error);
		} finally {
			if (showLoading) setRefreshing(false);
		}
	};

	const filteredCodes = codes;

	// Fetch data when component mounts
	useEffect(() => {
		fetchCodes(true);
	}, []);

	// Fetch data when screen comes into focus
	useEffect(() => {
		const unsubscribe = navigation.addListener('focus', () => {
			fetchCodes(false);
		});
		return unsubscribe;
	}, [navigation]);

	// Polling: Fetch data every 30 seconds when the screen is focused
	useEffect(() => {
		const unsubscribe = navigation.addListener('focus', () => {
			const intervalId = setInterval(() => {
				fetchCodes(false);
			}, 30000); // 30 seconds

			return () => clearInterval(intervalId);
		});

		return unsubscribe;
	}, [navigation]);

	useEffect(() => {
		const anim = Animated.loop(
			Animated.sequence([
				Animated.timing(bounceValue, {
					toValue: -10,
					duration: 500,
					useNativeDriver: Platform.OS !== 'web',
				}),
				Animated.timing(bounceValue, {
					toValue: 0,
					duration: 500,
					useNativeDriver: Platform.OS !== 'web',
				}),
			]),
		);
		anim.start();

		return () => {
			anim.stop();
		};
	}, [bounceValue]);

	return (
		<SafeAreaView style={sharedStyles.container} edges={['bottom', 'left', 'right']}>
			<Stack.Screen
				options={{
					title: 'Active Codes',
					headerShown: true,
					headerShadowVisible: false,
					headerTitleAlign: 'left',
					headerStyle: sharedStyles.header,
					headerTitleStyle: sharedStyles.title,
					headerRight: () => <UserIcon />,
				}}
			/>

			<View>
				<Text className="text-base font-Inter font-medium text-black mt-8 mb-7">All incoming guest</Text>

				<FlatList
					data={filteredCodes}
					keyExtractor={(item) => item.hashed_code}
					refreshing={refreshing}
					onRefresh={fetchCodes}
					style={{
						marginBottom: 70,
					}}
					contentContainerStyle={{ paddingBottom: 100 }}
					ListEmptyComponent={() => (
						<View className="flex-1 justify-center items-center">
							<Animated.Image
								source={images.ghostImg}
								className={`w-80 h-80 res`}
								style={{
									resizeMode: 'contain',
									transform: [{ translateY: bounceValue }],
								}}
							/>

							<Text className="text-center text-2xl opacity-20">{`Click the ‘+’ to add \nyour guest`}</Text>
						</View>
					)}
					renderItem={({ item }) => {
						const iso = String(item.valid_until ?? '')
							.replace(' ', 'T')
							.replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
						const parsed = new Date(iso);

						let formattedDate = 'Invalid date';
						let timeframe = 'Unknown';
						let timeLeftMinutes = 0;

						if (!isNaN(parsed.getTime())) {
							const day = String(parsed.getDate()).padStart(2, '0');
							const month = String(parsed.getMonth() + 1).padStart(2, '0');
							const year = parsed.getFullYear();
							formattedDate = `${day}/${month}/${year}`;

							const diffMs = parsed.getTime() - Date.now();
							if (diffMs <= 0) {
								timeframe = 'Expired';
							} else {
								const startDate = new Date(parsed.getTime() - 60 * 60 * 1000);
								const formatTime = (d: Date) => d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true }).replace(/\s+/g, '').toLowerCase();
								timeLeftMinutes = Math.floor((diffMs % 3600000) / 60000);
								timeframe = `${formatTime(startDate)} to ${formatTime(parsed)}`;
							}
						}

						return <CodeItem item={item} timeframe={timeframe} formattedDate={formattedDate} parsed={parsed} />;
					}}
				/>
			</View>
		</SafeAreaView>
	);
}
