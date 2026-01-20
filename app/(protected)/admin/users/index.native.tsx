import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, RefreshControl, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { getAllUsers } from '@/src/lib/api/user';
import { useEffect, useState, useMemo } from 'react';
import { AllUsers } from '@/src/types/user';
import { UserRolesType } from '@/src/types/general';
import { sharedStyles } from '@/src/theme/styles';
import icons from '@/src/constants/icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Back from '@/src/components/mobile/Back';

const AllUsersMobile = () => {
	const [users, setUsers] = useState<AllUsers>({ total: 0, page: 1, limit: 10, items: [] });
	const [isLoading, setIsLoading] = useState(true);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedRole, setSelectedRole] = useState<UserRolesType>(null);

	useEffect(() => {
		const getAllUsersData = async () => {
			try {
				setIsLoading(true);
				const data = await getAllUsers();
				setUsers(data);
			} catch (error) {
				console.error('Error fetching users:', error);
			} finally {
				setIsLoading(false);
			}
		};

		getAllUsersData();
	}, []);

	const handleRefresh = async () => {
		try {
			setIsRefreshing(true);
			const data = await getAllUsers();
			setUsers(data);
		} catch (error) {
			console.error('Error refreshing users:', error);
		} finally {
			setIsRefreshing(false);
		}
	};

	const filteredUsers = useMemo(() => {
		return users.items.filter((user) => {
			const matchesSearch = `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) || user.home_address?.toLowerCase().includes(searchQuery.toLowerCase());

			const matchesRole = !selectedRole || user.role === selectedRole;

			return matchesSearch && matchesRole;
		});
	}, [users.items, searchQuery, selectedRole]);

	return (
		<SafeAreaView style={[sharedStyles.container, sharedStyles.modalContainer]}>
			<Stack.Screen
				options={{
					headerShown: false,
					headerShadowVisible: false,
				}}
			/>

			<Back type="short-arrow" />

			<View className="flex-1">
				<Text
					className="text-2xl text-primary mb-5 font-ubuntu-bold mt-8"
					style={{
						fontSize: 23,
					}}
				>
					See All Users
				</Text>

				{/* Search Input */}
				<View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3 mb-4 ">
					<Feather name="search" size={20} color="#999" />
					<TextInput placeholder="Search User" placeholderTextColor="#999" value={searchQuery} onChangeText={setSearchQuery} className="flex-1 ml-3 text-primary font-inter-regular" />
				</View>

				{/* Filter Buttons */}
				<View className="flex-row gap-3 mb-6">
					<Pressable className={`flex-row items-center px-8 py-2.5 rounded-2xl border ${selectedRole === 'resident' ? 'bg-orange/10 border-orange' : 'bg-white border-gray-300'}`} onPress={() => setSelectedRole(selectedRole === 'resident' ? null : 'resident')}>
						<Image source={icons.adminHomeIcon} style={{ width: 20, height: 20, opacity: selectedRole === 'resident' ? 1 : 0.4, tintColor: selectedRole === 'resident' ? undefined : '#999' }} />
					</Pressable>

					<Pressable className={`flex-row items-center px-8 py-2.5 rounded-2xl border ${selectedRole === 'security' ? 'bg-teal/10 border-teal' : 'bg-white border-gray-300'}`} onPress={() => setSelectedRole(selectedRole === 'security' ? null : 'security')}>
						<Image source={icons.securityIcon} style={{ width: 20, height: 20, opacity: selectedRole === 'security' ? 1 : 0.4, tintColor: selectedRole === 'security' ? undefined : '#999' }} />
					</Pressable>

					<Pressable className={`flex-row items-center px-8 py-2.5 rounded-2xl border ${selectedRole === 'primary_admin' ? 'bg-primary/10 border-primary' : 'bg-white border-gray-300'}`} onPress={() => setSelectedRole(selectedRole === 'primary_admin' ? null : 'primary_admin')}>
						<Image source={icons.activeAdminIcon} style={{ width: 17, height: 20, opacity: selectedRole === 'primary_admin' ? 1 : 0.4, tintColor: selectedRole === 'primary_admin' ? undefined : '#999' }} />
					</Pressable>
				</View>
				{isLoading ? (
					<View className="flex-1 justify-center items-center py-10">
						<Text className="text-primary font-inter-regular">Loading users...</Text>
					</View>
				) : filteredUsers.length > 0 ? (
					<ScrollView refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />} contentContainerStyle={{ paddingBottom: 20 }}>
						<View className="px-5">
							{filteredUsers.map((user, index) => (
								<TouchableOpacity key={index} className={`flex-row items-center py-4 ${index !== filteredUsers.length - 1 ? 'border-b border-gray-200' : ''}`} onPress={() => router.push(`/(protected)/admin/users/${user.id}`)}>
									<Image source={user.role === 'resident' ? icons.adminHomeIcon : user.role === 'security' ? icons.securityIcon : icons.activeAdminIcon} style={{ width: user.role === 'admin' || user.role === 'primary_admin' ? 23 : 28, height: 28 }} />
									<View className="flex-1 ml-4">
										<Text className="text-primary text-lg font-inter-medium">{`${user.first_name} ${user.last_name}`}</Text>
										<Text className="text-gray-500 text-sm font-inter-regular mt-1">{user.home_address}</Text>
									</View>
									<Feather name="chevron-right" size={20} color="#1B998B" />
								</TouchableOpacity>
							))}
						</View>
					</ScrollView>
				) : (
					<View className="flex-1 justify-center items-center py-10">
						<Text className="text-primary font-inter-regular text-center">No users found</Text>
					</View>
				)}
			</View>
		</SafeAreaView>
	);
};

export default AllUsersMobile;
