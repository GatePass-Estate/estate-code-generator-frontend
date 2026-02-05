import { View, Text, ScrollView, TouchableOpacity, Image, FlatList, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/src/hooks/useAuthContext';
import { Stack, useRouter } from 'expo-router';
import { getAllEstateUsers } from '@/src/lib/api/user';
import { useEffect, useState } from 'react';
import { AllUsers } from '@/src/types/user';
import { sharedStyles } from '@/src/theme/styles';
import UserIcon from '@/src/components/mobile/UserIcon';
import icons from '@/src/constants/icons';
import { getRoleIcon, getRoleIconHeight, getRoleIconWidth } from '@/src/lib/helpers';

export default function AdminUsersMobilePage() {
	const { signOut } = useAuth();
	const [users, setUsers] = useState<AllUsers>({ total: 0, page: 1, limit: 10, items: [] });
	const [refreshing, setRefreshing] = useState(false);
	const router = useRouter();

	const handleRefresh = async () => {
		setRefreshing(true);
		try {
			const data = await getAllEstateUsers();
			setUsers(data);
		} catch (error) {
			console.log('Error refreshing users:', error);
		} finally {
			setRefreshing(false);
		}
	};

	useEffect(() => {
		const getAllEstateUsersData = async () => {
			try {
				const data = await getAllEstateUsers();
				setUsers(data);
			} catch (error) {
				console.log('Error fetching users:', error);
			}
		};

		getAllEstateUsersData();
	}, []);

	const securityPersonnelCount = users.items.filter((user) => user.role === 'security').length;

	const residentsCount = users.items.filter((user) => user.role === 'resident').length;

	const limitedUsers = users.items.slice(0, 4);

	return (
		<View style={sharedStyles.container}>
			<Stack.Screen
				options={{
					title: 'Admin',
					headerShown: true,
					headerShadowVisible: false,
					headerTitleAlign: 'left',
					headerStyle: sharedStyles.header,
					headerTitleStyle: sharedStyles.title,
					headerRight: () => <UserIcon type="user" />,
				}}
			/>

			<ScrollView contentContainerStyle={{ paddingTop: 40 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
				<View className="flex-row justify-between gap-3 mb-3">
					<View className="flex-1 border border-orange rounded-2xl p-4 py-7 bg-orange/10 flex-row gap-5 items-center">
						<Image source={icons.adminHomeIcon} style={{ width: 58, height: 51 }} />
						<View className="flex-col justify-center">
							<Text className="text-orange font-inter-medium">Residents</Text>
							<Text className="text-orange text-5xl font-ubuntu-bold">{residentsCount}</Text>
						</View>
					</View>

					<View className="flex-1 border border-teal rounded-2xl p-4 py-7 bg-teal/10 flex-row gap-5 items-center">
						<Image source={icons.securityIcon} style={{ width: 45, height: 55 }} />
						<View className="flex-col justify-center">
							<Text className="text-teal font-inter-medium">Security p...</Text>
							<Text className="text-teal text-5xl font-ubuntu-bold">{securityPersonnelCount}</Text>
						</View>
					</View>
				</View>

				<View className="flex-row gap-3 mb-10">
					<View className="flex-1 border border-primary rounded-2xl p-4 py-7 items-center">
						<Text className="text-grey/50 uppercase font-inter-medium tracking-wide">Total</Text>
						<Text className="text-primary text-5xl font-ubuntu-bold">{users.total}</Text>
					</View>

					<View className="flex-1 justify-center items-center p-4 rounded-2xl">
						<TouchableOpacity className="bg-light-grey rounded-full p-4" onPress={() => router.push('/admin/users/add')}>
							<Image source={icons.thinPlus} className="opacity-30" style={{ width: 30, height: 30 }} />
						</TouchableOpacity>
					</View>
				</View>

				<View className="flex-row justify-between gap-2 mb-12 rounded-2xl">
					<TouchableOpacity className="flex-1 items-center bg-accent rounded-xl py-5 px-2">
						<Image source={icons.inactiveGuestIcon} style={{ width: 30, height: 30 }} />
						<Text className="text-primary text-sm font-inter-regular mt-1.5 text-center">See All Users</Text>
					</TouchableOpacity>

					<TouchableOpacity className="flex-1 items-center py-5 px-2" onPress={() => router.push('/admin/users/add')}>
						<Image source={icons.addUserIcon} style={{ width: 30, height: 30 }} />
						<Text className="text-primary text-sm font-inter-regular mt-1.5 text-center">Register User</Text>
					</TouchableOpacity>

					<TouchableOpacity className="flex-1 items-center py-5 px-2" onPress={() => router.push('/admin/broadcast')}>
						<Image source={icons.broadcastIcon} style={{ width: 30, height: 30 }} />
						<Text className="text-primary text-sm font-inter-regular mt-1.5 text-center">Broadcast</Text>
					</TouchableOpacity>

					<TouchableOpacity className="flex-1 items-center py-5 px-2" onPress={() => router.push('/admin/edit-requests')}>
						<Image source={icons.editRequestIcon} style={{ width: 30, height: 30 }} />
						<Text className="text-primary text-sm font-inter-regular mt-1.5 text-center">Edit Requests</Text>
					</TouchableOpacity>
				</View>

				<View className="flex-row justify-between items-center mb-2">
					<Text className="text-lg font-inter-regular text-gray-800">All Users</Text>
					<TouchableOpacity onPress={() => router.push('/admin/users/')}>
						<Text className="font-ubuntu-medium text-teal text-sm">View All</Text>
					</TouchableOpacity>
				</View>

				<FlatList
					data={limitedUsers}
					keyExtractor={(item) => item.id!}
					scrollEnabled={false}
					ListEmptyComponent={
						<View className="py-8 items-center">
							<Text className="text-grey text-center text-md font-inter-regular">No users at the moment</Text>
						</View>
					}
					renderItem={({ item, index }) => (
						<TouchableOpacity className={`flex-row items-center py-3.5 ${index === limitedUsers.length - 1 ? '' : 'border-b'} border-gray-200 pl-2`} onPress={() => router.push(`/(protected)/admin/users/${item.id}`)}>
							<Image source={getRoleIcon(item.role)} style={{ width: getRoleIconWidth(item.role), height: getRoleIconHeight(item.role) }} />
							<View className="flex-1 ml-2.5">
								<Text className="text-primary text-lg font-inter-regular">{`${item.first_name} ${item.last_name}`}</Text>
								<Text className="text-primary text-sm font-inter-regular mt-0.5">{item.home_address}</Text>
							</View>
							<Feather name="chevron-right" size={20} color="#1B998B" />
						</TouchableOpacity>
					)}
				/>
			</ScrollView>
		</View>
	);
}
