import { View, Text, StyleSheet, TextInput, TouchableOpacity, Animated, FlatList, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { Image } from 'react-native';
import UserIcon from '@/src/components/mobile/UserIcon';
import { useEffect, useRef, useState } from 'react';
import images from '@/src/constants/images';
import { deleteMyGuest, getMyGuests } from '@/src/lib/api/guests';
import { Guest } from '@/src/types/guests';
import { GenderType, RelationshipType } from '@/src/types/general';
import { useUserStore } from '@/src/lib/stores/userStore';
import { generateCode } from '@/src/lib/api/codes';

const limit = 10;

const MyGuest = () => {
	const [searchQuery, setSearchQuery] = useState('');
	const [guests, setGuests] = useState<Guest[]>([]);
	const [loading, setLoading] = useState(true);
	const [deleting, setDeleting] = useState(false);
	const [running, setRunning] = useState<boolean>(false);

	const filteredGuests = guests.filter((guest) => guest.guest_name.toLowerCase().includes(searchQuery.toLowerCase()) || guest.relationship?.includes(searchQuery.toLowerCase()));

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
		fetchGuests();
	}, []);

	async function handleGenerateCode({ name, relationship_with_resident, gender }: { name: string; gender: GenderType; relationship_with_resident: RelationshipType }) {
		setRunning(true);
		try {
			const result = await generateCode({
				user_id: useUserStore.getState().user_id,
				estate_id: useUserStore.getState().estate_id ?? '',
				visitor_fullname: name,
				relationship_with_resident,
				gender,
			});

			const iso = String(result.valid_until ?? '')
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

			router.push({
				pathname: '/invite',
				params: {
					name,
					code: result.hashed_code,
					address: `${useUserStore.getState().home_address}, ${useUserStore.getState().estate_name}.`,
					timeframe,
					date: formattedDate,
				},
			});
		} catch (error) {
			Alert.alert('Error', 'Failed to generate code. Please try again.');
		} finally {
			setRunning(false);
		}
	}

	const bounceValue = useRef(new Animated.Value(0)).current;

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
						fontWeight: '600',
					},
				}}
			/>

			{filteredGuests?.length > limit && (
				<View style={styles.searchBar}>
					<Ionicons name="search" size={18} color="#555" style={{ marginLeft: 8 }} />
					<TextInput placeholder="Search" style={styles.searchInput} value={searchQuery} onChangeText={setSearchQuery} />
				</View>
			)}

			{filteredGuests?.length > 0 && (
				<>
					<Text
						style={[
							styles.savedLabel,
							{
								marginTop: filteredGuests?.length > limit ? 20 : 0,
							},
						]}
					>
						All Saved Guests
					</Text>
					<View style={styles.divider} />
				</>
			)}

			<FlatList
				data={filteredGuests}
				keyExtractor={(_, index) => index.toString()}
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
										handleGenerateCode({
											name: item.guest_name,
											relationship_with_resident: item.relationship as RelationshipType,
											gender: item.gender as GenderType,
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
