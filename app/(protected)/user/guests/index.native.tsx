import { View, Text, StyleSheet, TextInput, TouchableOpacity, Animated, FlatList, Alert, Platform, useWindowDimensions } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Image } from 'react-native';
import UserIcon from '@/src/components/mobile/UserIcon';
import { useEffect, useRef, useState } from 'react';
import images from '@/src/constants/images';
import { deleteMyGuest, getMyGuests } from '@/src/lib/api/guests';
import { Guest } from '@/src/types/guests';
import { GenderType, RelationshipType } from '@/src/types/general';
import { useUserStore } from '@/src/lib/stores/userStore';
import { generateCode } from '@/src/lib/api/codes';
import { sharedStyles } from '@/src/theme/styles';
import icons from '@/src/constants/icons';
import { menuRoutes } from '../_layout';
import WebSidebar from '@/src/components/web/WebSidebar';
import { getWidthBreakpoint } from '@/src/lib/helpers';
import Modal from '@/src/components/web/Modal';

const limit = 2;

const MyGuestMobile = () => {
	const [searchQuery, setSearchQuery] = useState('');
	const [guests, setGuests] = useState<Guest[]>([]);
	const [loading, setLoading] = useState(true);
	const [deleting, setDeleting] = useState(false);
	const [running, setRunning] = useState<boolean>(false);
	const { width } = useWindowDimensions();
	const [confirmModalVisible, setConfirmModalVisible] = useState(false);
	const [pendingGuestId, setPendingGuestId] = useState<string | null>(null);

	const isLargeScreen = width > getWidthBreakpoint();

	let { refresh } = useLocalSearchParams();

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
			console.log(error);
		} finally {
			setDeleting(false);
		}
	};

	useEffect(() => {
		fetchGuests();
	}, []);

	useEffect(() => {
		if (refresh == 'true') {
			fetchGuests();
			refresh = 'false';
		}
	}, [refresh]);

	useEffect(() => {
		if (Platform.OS === 'web') {
			document.title = 'Guests - GatePass';
		}
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

	const performDeleteGuest = async (id: string) => {
		setDeleting(true);
		try {
			await deleteMyGuest(id);
			setGuests((prev) => prev.filter((g) => g.id !== id));
		} catch (error) {
			console.error('Delete guest failed:', error);
		} finally {
			setDeleting(false);
		}
	};

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
			]),
		);
		anim.start();

		return () => {
			anim.stop();
		};
	}, [bounceValue]);

	return (
		<View style={sharedStyles.container}>
			{Platform.OS !== 'web' ? (
				<Stack.Screen
					options={{
						headerShown: true,
						title: 'My Guests',
						headerShadowVisible: false,
						headerTitleAlign: 'left',
						headerStyle: sharedStyles.header,
						headerTitleStyle: sharedStyles.title,
						headerRight: () => <UserIcon />,
					}}
				/>
			) : (
				<>
					<WebSidebar routes={menuRoutes} onNavigate={(route) => router.push(route as any)} />
					<View className={`flex flex-col justify-center gap-7 ${isLargeScreen ? 'mt-20' : 'mt-11'}`} />
					<View className="flex flex-row justify-between mb-5">
						<Text className={`${isLargeScreen ? 'text-4xl' : 'text-3xl font-ubuntu-medium'}`}>My Guests</Text>

						{!isLargeScreen && <UserIcon />}
					</View>
				</>
			)}

			<View className="flex-row bg-light-grey rounded-xl items-center px-2 mb-5 mt-4">
				<Image source={icons.searchIcon} style={{ width: 18, height: 18 }} />
				<TextInput placeholder="Search" style={styles.searchInput} value={searchQuery} onChangeText={setSearchQuery} />
			</View>

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

			<FlatList
				data={filteredGuests}
				keyExtractor={(_, index) => index.toString()}
				refreshing={loading}
				onRefresh={fetchGuests}
				style={{
					marginBottom: 100,
				}}
				ListEmptyComponent={() =>
					running ? (
						<></>
					) : (
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
					)
				}
				renderItem={({ item }) => {
					return (
						<View
							style={[
								styles.card,
								{
									backgroundColor: item.gender == 'female' ? '#f45f36e' : item.gender == 'male' ? '#167a6ec' : '#F7F9F9',
									borderColor: item.gender == 'female' ? '#F46036' : item.gender == 'male' ? '#167a6f' : '#9B9797',
								},
							]}
						>
							<View style={styles.guestInfo}>
								{item.gender === 'male' ? (
									<Image source={icons.maleIcon} style={{ width: 24, height: 24 }} />
								) : item.gender === 'female' ? (
									<Image source={icons.femaleIcon} style={{ width: 20, height: 28.5 }} />
								) : (
									<Image source={icons.notSayingGender} style={{ width: 24, height: 24 }} />
								)}

								<View style={{ marginLeft: 10 }}>
									<Text className="font-Inter text-[16px] font-normal text-black">{item.guest_name}</Text>

									<Text className="capitalize text-[14px] text-primary font-inter-semibold text-sm ">{item.relationship}</Text>
								</View>
							</View>

							<View className="gap-5 flex-row">
								<TouchableOpacity
									onPress={() => {
										if (Platform.OS !== 'web') {
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
												{ cancelable: true },
											);
										} else {
											setPendingGuestId(item.id);
											setConfirmModalVisible(true);
										}
									}}
								>
									<Image source={icons.deleteMobileIcon} style={{ width: 22, height: 22, resizeMode: 'contain', tintColor: '#a6a4a4' }} />
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
									<Image source={icons.generateCodeIcon} style={{ width: 22, height: 22, resizeMode: 'contain', tintColor: '#a6a4a4' }} />
								</TouchableOpacity>
							</View>
						</View>
					);
				}}
			/>

			{confirmModalVisible && (
				<Modal
					closeModal={() => {
						setConfirmModalVisible(false);
						setPendingGuestId(null);
					}}
					heading={'Confirm delete'}
					message={`Are you sure you want to delete this guest? This action cannot be undone.`}
					btnDisabled={deleting}
					actionRunnig={deleting}
					cancelText={'Cancel'}
					action={async () => {
						if (!pendingGuestId) return;
						await performDeleteGuest(pendingGuestId);
						setConfirmModalVisible(false);
						setPendingGuestId(null);
					}}
					runningText={'Deleting...'}
					actionText={'Delete'}
				/>
			)}
		</View>
	);
};

export default MyGuestMobile;

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
