import { View, Text, StyleSheet, TextInput, TouchableOpacity, Animated, FlatList, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { Image } from 'react-native';
import UserIcon from '@/components/UserIcon';
import { useEffect, useRef, useState } from 'react';
import { Guest } from '@/types/guests';
import { deleteMyGuest, getMyGuests } from '@/lib/api/guests';
import images from '@/constants/images';

const MyGuest = () => {
	const [searchQuery, setSearchQuery] = useState('');
	const [guests, setGuests] = useState<Guest[]>([]);
	const [loading, setLoading] = useState(true);
	const [deleting, setDeleting] = useState(false);

	const filteredGuests = guests.filter((guest) => guest.guest_name.toLowerCase().includes(searchQuery.toLowerCase()) || guest.relationship.toLowerCase().includes(searchQuery.toLowerCase()));

	const bounceValue = useRef(new Animated.Value(0)).current;

	const fetchGuests = async () => {
		setLoading(true);
		try {
			const result = await getMyGuests();
			setGuests(result.items);
		} catch (error) {
		} finally {
			setLoading(false);
		}
	};

	const deleteGuest = async (id: string) => {
		setDeleting(true);
		try {
			await deleteMyGuest(id);
			setGuests((prev) => prev.filter((g) => g.id !== id));
		} catch (error) {
		} finally {
			setDeleting(false);
		}
	};

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

	useEffect(() => {
		fetchGuests();
	}, []);

	return (
		<View style={styles.container}>
			<Stack.Screen
				options={{
					headerShown: true,
					title: 'My Guests',
					headerShadowVisible: false,
					headerStyle: {
						backgroundColor: '#FBFEFF',
					},
					headerRight: () => <UserIcon />,
					headerTitleStyle: {
						color: '#113E55',
						fontFamily: 'UbuntuSans',
						fontWeight: '700',
					},
				}}
			/>
			{filteredGuests.length > 10 && (
				<View style={styles.searchBar}>
					<Ionicons name="search" size={18} color="#555" style={{ marginLeft: 8 }} />
					<TextInput placeholder="Search" style={styles.searchInput} value={searchQuery} onChangeText={setSearchQuery} />
				</View>
			)}

			{filteredGuests.length > 0 && (
				<>
					<Text style={styles.savedLabel}>All Saved Guests</Text>
					<View style={styles.divider} />
				</>
			)}

			<FlatList
				data={filteredGuests}
				keyExtractor={(_, index) => index.toString()}
				// contentContainerStyle={{ paddingBottom: 100, flexGrow: 1 }}
				refreshing={loading}
				onRefresh={fetchGuests}
				ListEmptyComponent={() => (
					<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40 }}>
						<Animated.Image
							source={images.ghostImg}
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
				renderItem={({ item }) => {
					return (
						<View
							style={[
								styles.card,
								{
									backgroundColor: item.gender == 'female' ? '#f45f36e' : item.gender == 'male' ? '#167a6ec' : '#dcdcdc30',
									borderColor: item.gender == 'female' ? '#F46036' : item.gender == 'male' ? '#167a6f' : '#dcdcdc',
								},
							]}
						>
							<View style={styles.guestInfo}>
								{item.gender === 'male' ? <Ionicons name="male" size={18} color="#167a6f" /> : item.gender === 'female' ? <Ionicons name="female" size={18} color="#F46036" /> : <Image source={images.notSaying} style={{ width: 19, height: 19 }} />}

								<View style={{ marginLeft: 10 }}>
									<Text style={styles.guestName}>{item.guest_name}</Text>
									<Text style={styles.guestRelation}>{item.relationship}</Text>
								</View>
							</View>

							<View style={styles.actions}>
								<TouchableOpacity
									onPress={() => {
										Alert.alert(
											'Delete guest',
											`Are you sure you want to delete ${item.guest_name}?`,
											[
												{ text: 'Cancel', style: 'cancel' },
												{
													text: 'Delete',
													style: 'destructive',
													onPress: () => deleteGuest(item.id),
												},
											],
											{ cancelable: true }
										);
									}}
								>
									<Image source={images.deleteImg} style={{ width: 35, height: 35, resizeMode: 'contain', tintColor: '#a6a4a4' }} />
								</TouchableOpacity>

								<TouchableOpacity
									onPress={() =>
										router.push({
											pathname: '/invite-screen',
											params: {
												name: item.id,
											},
										})
									}
								>
									<Image source={images.generatedCodeImg} style={{ width: 35, height: 35, resizeMode: 'contain', tintColor: '#a6a4a4' }} />
								</TouchableOpacity>
							</View>
						</View>
					);
				}}
			/>
		</View>
	);
};

export default MyGuest;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FBFEFF',
		paddingHorizontal: 20,
		paddingTop: 35,
		elevation: 0,
		shadowOpacity: 0,
		borderBottomWidth: 0,
	},

	title: {
		fontSize: 22,
		fontWeight: 'bold',
		marginBottom: 15,
		color: '#113E55',
	},

	searchBar: {
		flexDirection: 'row',
		backgroundColor: '#F7F9F9',
		borderRadius: 8,
		alignItems: 'center',
		paddingHorizontal: 8,
		marginBottom: 20,
	},

	profileCircle: {
		width: 35,
		height: 35,
		borderRadius: 17,
		borderWidth: 1,
		marginRight: 30,
		borderColor: '#167a6f',
		justifyContent: 'center',
		alignItems: 'center',
	},

	profileInitials: {
		color: '#167a6f',
		fontWeight: '300',
		fontFamily: 'UbuntuSans',
		fontSize: 23,
	},

	searchInput: {
		padding: 10,
		flex: 1,
		fontSize: 14,
		paddingVertical: 20,
	},

	savedLabel: {
		fontSize: 14,
		marginTop: 20,
		marginBottom: 10,
		color: '#222',
	},

	card: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		padding: 12,
		borderRadius: 10,
		backgroundColor: '#F6F6F6',
		marginBottom: 10,
		alignItems: 'center',
		borderWidth: 1,
		height: 60,
		borderColor: '#e5e5e5',
	},

	guestInfo: {
		flexDirection: 'row',
		alignItems: 'center',
	},

	guestName: {
		fontWeight: 'light',
		fontSize: 18,
		color: '#04121a',
	},

	guestRelation: {
		fontWeight: 'semibold',
		fontSize: 13,
		color: '#113e55',
	},

	actions: {
		flexDirection: 'row',
	},

	fab: {
		position: 'absolute',
		bottom: 20,
		left: '50%',
		transform: [{ translateX: -30 }],
		backgroundColor: '#113E55',
		width: 60,
		height: 60,
		borderRadius: 30,
		justifyContent: 'center',
		alignItems: 'center',
		elevation: 5,
	},

	divider: {
		height: 0.5,
		backgroundColor: '#113E55',
		marginTop: 8,
		marginBottom: 20,
		width: '100%',
	},
});
