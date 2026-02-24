import Back from '@/src/components/mobile/Back';
import { SingleDetail } from '@/src/components/mobile/SIngleDetail';
import { getUserById, promoteToAdmin, demoteToResident } from '@/src/lib/api/user';
import { sharedStyles } from '@/src/theme/styles';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Animated, PanResponder } from 'react-native';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '@/src/lib/stores/userStore';
import { User } from '@/src/types/user';

// Dummy API function for deactivating user
const deactivateUser = async (userId: string): Promise<boolean> => {
	return new Promise((resolve) => {
		setTimeout(() => {
			console.log('Deactivating user:', userId);
			resolve(true);
		}, 1500);
	});
};

export default function SingleUserMobile() {
	const { userId } = useLocalSearchParams();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [showDeactivateModal, setShowDeactivateModal] = useState(false);
	const [showPromoteModal, setShowPromoteModal] = useState(false);
	const [deactivating, setDeactivating] = useState(false);
	const [processing, setProcessing] = useState(false);
	const [dialogMessage, setDialogMessage] = useState('');
	const [dialogVisible, setDialogVisible] = useState(false);
	const [dialogType, setDialogType] = useState<'success' | 'error'>('success');
	const [promoteActionType, setPromoteActionType] = useState<'promote' | 'demote' | null>(null);
	const myId = useUserStore.getState().user_id;
	const panY = new Animated.Value(0);
	const [userData, setUserData] = useState<User>({
		first_name: '',
		last_name: '',
		home_address: '',
		estate_name: '',
		email: '',
		phone_number: '',
		user_id: userId as string,
		estate_id: '',
		role: 'resident',
		gender: null,
		status: false,
	});

	const panResponder = PanResponder.create({
		onStartShouldSetPanResponder: () => true,
		onMoveShouldSetPanResponder: (evt, gestureState) => gestureState.dy > 10,
		onPanResponderMove: Animated.event([null, { dy: panY }], { useNativeDriver: false }),
		onPanResponderRelease: (evt, gestureState) => {
			if (gestureState.dy > 100) {
				setShowDeactivateModal(false);
				panY.setValue(0);
			} else {
				Animated.spring(panY, {
					toValue: 0,
					useNativeDriver: false,
				}).start();
			}
		},
	});

	useEffect(() => {
		const fetchUserData = async () => {
			try {
				setLoading(true);
				setError(null);
				const resident = await getUserById(userId as string);

				if (!resident) {
					setError('User not found');
					setUserData({
						first_name: '',
						last_name: '',
						home_address: '',
						estate_name: '',
						email: '',
						phone_number: '',
						user_id: userId as string,
						estate_id: '',
						role: 'resident',
						gender: null,
						status: false,
					});
				} else {
					setUserData(resident);
				}
			} catch (error) {
				console.log('Error fetching user data:', error);
				setError(error instanceof Error ? error.message : 'Failed to load user data');
			} finally {
				setLoading(false);
			}
		};

		fetchUserData();
	}, []);

	const handleDeactivate = async () => {
		setDeactivating(true);

		try {
			const success = await deactivateUser(userId as string);

			if (success) {
				setShowDeactivateModal(false);
				panY.setValue(0);
				setDialogType('success');
				setDialogMessage('User has been deactivated successfully!');
				setDialogVisible(true);
			}
		} catch (err) {
			console.log('Error deactivating user:', err);
			setDialogType('error');
			setDialogMessage('Failed to deactivate user. Please try again.');
			setDialogVisible(true);
		} finally {
			setDeactivating(false);
		}
	};

	const promptPromote = () => {
		if (userData.role === 'admin' || userData.role === 'primary_admin') {
			if (userId === myId) {
				setDialogType('error');
				setDialogMessage('You cannot demote yourself from admin.');
				setDialogVisible(true);
				return;
			}

			if (userData.role === 'primary_admin') {
				setDialogType('error');
				setDialogMessage('You cannot demote the primary admin.');
				setDialogVisible(true);
				return;
			}
			setPromoteActionType('demote');
		} else {
			if (userId === myId) {
				setDialogType('error');
				setDialogMessage('You cannot promote yourself to admin.');
				setDialogVisible(true);
				return;
			}
			setPromoteActionType('promote');
		}
		setShowPromoteModal(true);
	};

	const handlePromoteOrDemote = async () => {
		if (!promoteActionType) return;

		setProcessing(true);
		try {
			let message = '';

			if (promoteActionType === 'promote') {
				await promoteToAdmin(userId as string);
				message = `${userData.first_name} has been successfully promoted to Admin.`;
			} else if (promoteActionType === 'demote') {
				await demoteToResident(userId as string);
				message = `${userData.first_name} has been successfully demoted to Resident.`;
			}

			setShowPromoteModal(false);
			setPromoteActionType(null);
			setDialogType('success');
			setDialogMessage(message);
			setDialogVisible(true);

			// Refresh user data after successful action
			setTimeout(async () => {
				const resident = await getUserById(userId as string);
				if (resident) {
					setUserData(resident);
				}
			}, 1500);
		} catch (err) {
			console.log('Error processing action:', err);
			setShowPromoteModal(false);
			setPromoteActionType(null);
			setDialogType('error');
			setDialogMessage(err instanceof Error ? err.message : 'Failed to process action.');
			setDialogVisible(true);
		} finally {
			setProcessing(false);
		}
	};

	return (
		<>
			<SafeAreaView style={[sharedStyles.container, sharedStyles.modalContainer, { paddingBottom: 50 }]}>
				<Stack.Screen
					options={{
						headerShown: false,
						headerShadowVisible: false,
					}}
				/>

				<Back type="short-arrow" />

				{loading ? (
					<View className="flex-1 justify-center items-center">
						<ActivityIndicator size="large" color="#113E55" />
					</View>
				) : error ? (
					<View className="flex-1 justify-center items-center px-4">
						<View className="bg-red-50 border border-red-200 rounded-lg p-4 items-center">
							<Text className="text-red-800 font-ubuntu-semibold text-center mb-3">Error Loading User</Text>
							<Text className="text-red-600 text-center mb-4">{error}</Text>
							<TouchableOpacity
								className="bg-red-600 px-6 py-2 rounded-lg"
								onPress={() => {
									const fetchUserData = async () => {
										try {
											setLoading(true);
											setError(null);
											const resident = await getUserById(userId as string);
											if (resident) {
												setUserData(resident);
											} else {
												setError('User not found');
											}
										} catch (err) {
											setError(err instanceof Error ? err.message : 'Failed to load user data');
										} finally {
											setLoading(false);
										}
									};
									fetchUserData();
								}}
							>
								<Text className="text-white font-ubuntu-semibold">Retry</Text>
							</TouchableOpacity>
						</View>
					</View>
				) : (
					<>
						<View className="flex-1">
							<Text
								className="text-2xl text-primary mb-5 font-ubuntu-bold mt-8"
								style={{
									fontSize: 23,
								}}
							>
								User Profile
							</Text>

							<View className=" bg-transparent p-4 rounded-lg border-micro py-4 overflow-hidden">
								<SingleDetail label="Name" value={`${userData.first_name} ${userData.last_name}`} />
								<SingleDetail label="Address" value={`${userData.home_address}, ${userData.estate_name}.`} />
								<SingleDetail label="Email Address" value={userData.email} />
								<SingleDetail label="Phone Number" value={userData.phone_number} />
							</View>
						</View>

						<View className="mt-auto flex-row gap-5">
							<TouchableOpacity onPress={() => setShowDeactivateModal(true)} disabled={deactivating || processing} className={`flex-1 bg-teal justify-center items-center py-5 !rounded-xl ${deactivating || processing ? 'opacity-70' : ''}`}>
								{deactivating ? <ActivityIndicator color="#fff" size="small" /> : <Text className="text-white font-ubuntu-semibold text-md">Deactivate</Text>}
							</TouchableOpacity>

							{userData.role !== 'security' && (
								<TouchableOpacity onPress={promptPromote} disabled={processing || deactivating} className={`flex-1 bg-primary justify-center items-center py-5 !rounded-xl ${processing || deactivating ? 'opacity-70' : ''}`}>
									<Text className="text-white font-ubuntu-semibold text-md">{userData.role === 'admin' || userData.role === 'primary_admin' ? 'Make Resident' : 'Make Admin'}</Text>
								</TouchableOpacity>
							)}
						</View>

						{/* Deactivate Confirmation Bottom Drawer */}
						<Modal visible={showDeactivateModal} transparent animationType="none" onDismiss={() => panY.setValue(0)}>
							<TouchableOpacity
								activeOpacity={1}
								onPress={() => {
									setShowDeactivateModal(false);
									panY.setValue(0);
								}}
								className="flex-1 bg-black/50 justify-end"
							>
								<Animated.View style={{ transform: [{ translateY: panY }] }} {...panResponder.panHandlers} className="bg-white rounded-t-3xl p-6 pb-10">
									<View className="mb-2">
										<View className="h-1 w-12 bg-grey rounded-full self-center mb-4" />
									</View>

									<Text className="text-2xl font-ubuntu-medium text-grey mb-3 text-center">Are You sure ?</Text>
									<Text className="text-black text-base font-inter-regular mb-2 text-center">Confirm if you want to deactivate this user from the system</Text>
									<Text className="text-black text- font-inter-regular mb-6 text-center">This action will be reviewed in 48 hours.</Text>

									<View className="flex-row gap-3 mt-6">
										<TouchableOpacity onPress={() => setShowDeactivateModal(false)} disabled={deactivating} className={`flex-1 border-2 bg-teal border-teal py-4 rounded-lg ${deactivating ? 'opacity-70' : ''}`}>
											<Text className="text-white font-ubuntu-semibold text-center text-md">Cancel</Text>
										</TouchableOpacity>

										<TouchableOpacity onPress={handleDeactivate} disabled={deactivating} className={`flex-1 bg-primary py-4 rounded-lg ${deactivating ? 'opacity-70' : ''}`}>
											{deactivating ? <ActivityIndicator color="#fff" size="small" /> : <Text className="text-white font-ubuntu-semibold text-center text-md">Proceed</Text>}
										</TouchableOpacity>
									</View>
								</Animated.View>
							</TouchableOpacity>
						</Modal>

						{/* Promote/Demote Confirmation Bottom Drawer */}
						<Modal visible={showPromoteModal} transparent animationType="none" onDismiss={() => panY.setValue(0)}>
							<TouchableOpacity
								activeOpacity={1}
								onPress={() => {
									setShowPromoteModal(false);
									setPromoteActionType(null);
								}}
								className="flex-1 bg-black/50 justify-end"
							>
								<Animated.View style={{ transform: [{ translateY: panY }] }} className="bg-white rounded-t-3xl p-6 pb-10">
									<View className="mb-2">
										<View className="h-1 w-12 bg-grey rounded-full self-center mb-4" />
									</View>

									<Text className="text-2xl font-ubuntu-medium text-grey mb-3 text-center">Are You sure ?</Text>
									<Text className="text-black text-base font-inter-regular mb-2 text-center">{promoteActionType === 'promote' ? `Confirm if you want to promote ${userData.first_name} to admin` : `Confirm if you want to demote ${userData.first_name} to resident`}</Text>

									<View className="flex-row gap-3 mt-6">
										<TouchableOpacity
											onPress={() => {
												setShowPromoteModal(false);
												setPromoteActionType(null);
											}}
											disabled={processing}
											className={`flex-1 border-2 bg-teal border-teal py-4 rounded-lg ${processing ? 'opacity-70' : ''}`}
										>
											<Text className="text-white font-ubuntu-semibold text-center text-md">Cancel</Text>
										</TouchableOpacity>

										<TouchableOpacity onPress={handlePromoteOrDemote} disabled={processing} className={`flex-1 bg-primary py-4 rounded-lg ${processing ? 'opacity-70' : ''}`}>
											{processing ? <ActivityIndicator color="#fff" size="small" /> : <Text className="text-white font-ubuntu-semibold text-center text-md">{promoteActionType === 'promote' ? 'Promote' : 'Demote'}</Text>}
										</TouchableOpacity>
									</View>
								</Animated.View>
							</TouchableOpacity>
						</Modal>
						{/* Dialog Box for System Messages */}
						<Modal visible={dialogVisible} transparent animationType="fade">
							<View className="flex-1 justify-center items-center bg-black/50">
								<View className="bg-white rounded-lg p-6 mx-4 max-w-xs">
									<Text className={`text-lg font-ubuntu-semibold text-center mb-4 ${dialogType === 'success' ? 'text-green-600' : 'text-red-600'}`}>{dialogType === 'success' ? 'Success' : 'Error'}</Text>
									<Text className="text-grey text-base font-ubuntu-regular text-center mb-6">{dialogMessage}</Text>

									<TouchableOpacity onPress={() => setDialogVisible(false)} className="bg-primary py-3 rounded-lg">
										<Text className="text-white font-ubuntu-semibold text-center">OK</Text>
									</TouchableOpacity>
								</View>
							</View>
						</Modal>
					</>
				)}
			</SafeAreaView>
		</>
	);
}
