import Back from '@/src/components/mobile/Back';
import { SingleDetail } from '@/src/components/mobile/SIngleDetail';
import { getUserById } from '@/src/lib/api/user';
import { sharedStyles } from '@/src/theme/styles';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SingleUserMobile() {
	const { userId } = useLocalSearchParams();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [userData, setUserData] = useState<any>({
		first_name: '',
		last_name: '',
		home_address: '',
		estate_name: '',
		email: '',
		phone_number: '',
		user_id: userId,
		estate_id: '',
		role: 'resident',
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
						user_id: userId,
						estate_id: '',
						role: 'resident',
					});
				} else {
					setUserData(resident);
				}
			} catch (error) {
				console.error('Error fetching user data:', error);
				setError(error instanceof Error ? error.message : 'Failed to load user data');
			} finally {
				setLoading(false);
			}
		};

		fetchUserData();
	}, []);

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

							<View className=" bg-transparent p-4 rounded-lg border-micro py-4">
								<SingleDetail label="Name" value={`${userData.first_name} ${userData.last_name}`} />
								<SingleDetail label="Address" value={`${userData.home_address}, ${userData.estate_name}.`} />
								<SingleDetail label="Email Address" value={userData.email} />
								<SingleDetail label="Phone Number" value={userData.phone_number} />
							</View>
						</View>

						<View className="mt-auto flex-row gap-5">
							<TouchableOpacity className={`flex-1 bg-teal justify-center items-center py-5 !rounded-xl`}>
								<Text className="text-white font-ubuntu-semibold text-md">Deactivate</Text>
							</TouchableOpacity>

							<TouchableOpacity className={`flex-1 bg-primary justify-center items-center py-5 !rounded-xl`}>
								<Text className="text-white font-ubuntu-semibold text-md">Make Admin</Text>
							</TouchableOpacity>
						</View>
					</>
				)}
			</SafeAreaView>
		</>
	);
}
