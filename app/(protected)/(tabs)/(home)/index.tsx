import { Stack, router } from 'expo-router';
import CountdownRing from '@/components/CountdownRing';
import { View, Text, FlatList, SafeAreaView, StyleSheet, Pressable, Image, Animated, RefreshControl } from 'react-native';
import UserIcon from '@/components/UserIcon';
import { useEffect, useRef, useState } from 'react';
import images from '@/constants/images';

const guestData: any = [
	{ name: 'Sandra', code: '765 3E2', count: 45 },
	{ name: 'Maya', code: '123 9ZQ', count: 30 },
	{ name: 'Daniel', code: '556 LKP', count: 15 },
	{ name: 'Fola', code: '990 XTD', count: 60 },
];

export default function ActiveCodes() {
	const bounceValue = useRef(new Animated.Value(0)).current;
	const [refreshing, setRefreshing] = useState(false);

	useEffect(() => {
		Animated.loop(
			Animated.sequence([
				Animated.timing(bounceValue, {
					toValue: -10,
					duration: 500,
					useNativeDriver: true,
				}),
				Animated.timing(bounceValue, {
					toValue: 0,
					duration: 500,
					useNativeDriver: true,
				}),
			])
		).start();
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
						fontWeight: '700',
					},
				}}
			/>

			{guestData.length > 0 ? (
				<>
					<Text style={styles.subText} className="">
						All incoming guests
					</Text>

					<FlatList
						data={guestData}
						keyExtractor={(_, index) => index.toString()}
						refreshing={refreshing}
						refreshControl={<RefreshControl refreshing={refreshing} />}
						onRefresh={() => {}}
						contentContainerStyle={{ paddingBottom: 100 }}
						renderItem={({ item }) => (
							<Pressable
								style={styles.guestCard}
								className={``}
								onPress={() =>
									router.push({
										pathname: '/invite-screen',
										params: {
											name: item.name,
											code: item.code,
										},
									})
								}
							>
								<View style={{ flex: 1 }}>
									<Text style={styles.guestName} className={``}>
										{item.name}
									</Text>
									<Text style={styles.guestCode} className={``}>
										{item.code}
									</Text>
								</View>
								<CountdownRing size={55} storageKey={`guest-${item.code}`} />
							</Pressable>
						)}
					/>
				</>
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
		fontWeight: 'semibold',
		fontFamily: 'UbuntuSans',
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
		color: '#5C5C5C',
		marginBottom: 5,
	},
	guestCode: {
		fontSize: 25,
		fontWeight: '600',
		letterSpacing: 5,
		color: '#E05930',
		fontFamily: 'UbuntuSans',
	},
});
