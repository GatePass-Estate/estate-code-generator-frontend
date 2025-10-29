import { Stack, router } from 'expo-router';
import CountdownRing from '@/src/components/common/CountdownRing';
import { View, Text, FlatList, SafeAreaView, StyleSheet, Pressable, Image, Animated, RefreshControl, Platform } from 'react-native';
import UserIcon from '@/src/components/mobile/UserIcon';
import { useEffect, useRef, useState } from 'react';
import images from '@/src/constants/images';
import { Codes } from '@/src/types/codes';
import { getAllCodes } from '@/src/lib/api/codes';
import { useUserStore } from '@/src/lib/stores/userStore';

const guestData: any = [
	{ name: 'Sandra', code: '765 3E2', count: 45 },
	{ name: 'Maya', code: '123 9ZQ', count: 30 },
	{ name: 'Daniel', code: '556 LKP', count: 15 },
	{ name: 'Fola', code: '990 XTD', count: 60 },
];

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
			])
		);
		anim.start();

		return () => {
			anim.stop();
		};
	}, [bounceValue]);

	return (
		<SafeAreaView style={styles.container}>
			<Stack.Screen
				options={{
					headerShown: true,
					title: 'Active Codes',
					headerStyle: {
						backgroundColor: '#FBFEFF',
					},
					headerShadowVisible: false,
					headerRight: () => <UserIcon />,
					headerTitleStyle: {
						color: '#113E55',
						fontFamily: 'UbuntuSans',
						fontWeight: 'semibold',
					},
				}}
			/>

			{guestData.length > 0 ? (
				<View
					style={{
						paddingHorizontal: Platform.OS != 'android' ? 20 : 0,
					}}
				>
					<Text style={styles.subText} className="">
						All incoming guests
					</Text>

					<FlatList
						data={codes}
						keyExtractor={(_, index) => index.toString()}
						refreshing={refreshing}
						refreshControl={<RefreshControl refreshing={refreshing} />}
						onRefresh={fetchCodes}
						contentContainerStyle={{ paddingBottom: 100 }}
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
									style={styles.guestCard}
									className={``}
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
										<Text style={styles.guestName} className={``}>
											{item.visitor_fullname}
										</Text>
										<Text style={styles.guestCode} className={``}>
											{item.hashed_code}
										</Text>
									</View>
									<CountdownRing size={55} initialMinutes={timeLeftMinutes} />
								</Pressable>
							);
						}}
					/>
				</View>
			) : (
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
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FBFEFF',
		paddingHorizontal: 20,
		paddingTop: 3,
	},
	subText: {
		fontSize: 15,
		fontWeight: '500',
		fontFamily: 'Inter',
		marginTop: 40,
		marginBottom: 30,
		color: '#04121a',
	},
	guestCard: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		borderWidth: 0.2,
		borderColor: '#6d909c',
		borderRadius: 10,
		padding: 15,
		marginBottom: 12,
	},
	guestName: {
		fontSize: 13,
		fontWeight: '600',
		color: '#9B9797',
		marginBottom: 5,
	},
	guestCode: {
		fontSize: 27,
		fontWeight: '600',
		letterSpacing: 5,
		color: '#E05930',
		fontFamily: 'UbuntuSans',
		textTransform: 'uppercase',
	},
});
