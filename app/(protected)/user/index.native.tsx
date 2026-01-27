import { Stack, router } from 'expo-router';
import CountdownRing from '@/src/components/common/CountdownRing';
import { View, Text, FlatList, Pressable, Animated, Platform } from 'react-native';
import UserIcon from '@/src/components/mobile/UserIcon';
import { useEffect, useRef, useState } from 'react';
import images from '@/src/constants/images';
import { Codes } from '@/src/types/codes';
import { getAllCodes } from '@/src/lib/api/codes';
import { useUserStore } from '@/src/lib/stores/userStore';
import { sharedStyles } from '@/src/theme/styles';
import { timeCalc } from '@/src/lib/helpers';

export default function HomeMobile({}) {
	const bounceValue = useRef(new Animated.Value(0)).current;
	const [refreshing, setRefreshing] = useState(true);
	const [codes, setCodes] = useState<Codes[]>([]);

	const fetchCodes = async () => {
		setRefreshing(true);
		try {
			const result = await getAllCodes(useUserStore.getState().user_id);
			setCodes(result.items.filter((code) => !code.is_expired));
		} catch (error) {
			console.error('Failed to fetch codes:', error);
		} finally {
			setRefreshing(false);
		}
	};

	const filteredCodes = codes;

	useEffect(() => {
		fetchCodes();
	}, []);

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
		<View style={sharedStyles.container}>
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

						return (
							<Pressable
								className={`flex flex-row justify-between items-center border-[0.5px] border-accent rounded-lg p-4 mb-4 bg-[#F9FDFF]`}
								onPress={() =>
									router.push({
										pathname: '/invite',
										params: {
											name: item.visitor_fullname,
											code: item.hashed_code,
											timeframe,
											address: `${useUserStore.getState().home_address}, ${useUserStore.getState().estate_name}.`,
											date: formattedDate,
										},
									})
								}
							>
								<View style={{ flex: 1 }}>
									<Text className={`text-sm font-medium text-grey mb-1`}>{item.visitor_fullname}</Text>

									<Text className={`text-[27px] font-UbuntuSans uppercase text-orange tracking-[5px] font-bold`}>{item.hashed_code.slice(0, 3) + ' ' + item.hashed_code.slice(3)}</Text>
								</View>
								<CountdownRing
									size={50}
									expiresAt={parsed.getTime()}
									onExpire={() => {
										setCodes((prev) => prev.filter((c) => c.hashed_code !== item.hashed_code));
									}}
								/>
							</Pressable>
						);
					}}
				/>
			</View>
		</View>
	);
}
