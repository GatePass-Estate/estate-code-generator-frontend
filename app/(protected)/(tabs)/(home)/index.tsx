import { Stack, router } from 'expo-router';
import CountdownRing from '@/components/CountdownRing';
import { View, Text, FlatList, SafeAreaView, StyleSheet, Pressable, Image, Animated } from 'react-native';
import UserIcon from '@/components/UserIcon';
import { useEffect, useRef } from 'react';

const guestData: any = [
	{ name: 'Sandra', code: '765 3E2', count: 45 },
	{ name: 'Maya', code: '123 9ZQ', count: 30 },
	{ name: 'Daniel', code: '556 LKP', count: 15 },
	{ name: 'Fola', code: '990 XTD', count: 60 },
];

export default function ActiveCodes() {
	const bounceValue = useRef(new Animated.Value(0)).current;

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
					<Text style={styles.subText}>All incoming guests</Text>

					<FlatList
						data={guestData}
						keyExtractor={(_, index) => index.toString()}
						contentContainerStyle={{ paddingBottom: 100 }}
						renderItem={({ item }) => (
							<Pressable
								style={styles.guestCard}
								onPress={() =>
									router.push({
										pathname: '/invitePage',
										params: {
											name: item.name,
											code: item.code,
										},
									})
								}
							>
								<View style={{ flex: 1 }}>
									<Text style={styles.guestName}>{item.name}</Text>
									<Text style={styles.guestCode}>{item.code}</Text>
								</View>
								<CountdownRing size={55} storageKey={`guest-${item.code}`} />
							</Pressable>
						)}
					/>
				</>
			) : (
				<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
					<Animated.Image
						source={require('@/assets/images/ghost.png')}
						style={{
							width: 300,
							height: 300,
							resizeMode: 'contain',
							transform: [{ translateY: bounceValue }],
						}}
					/>

					<Text style={{ textAlign: 'center', fontSize: 23, opacity: 0.2 }}>{`Click the ‘+’ to add \nyour guest`}</Text>
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
