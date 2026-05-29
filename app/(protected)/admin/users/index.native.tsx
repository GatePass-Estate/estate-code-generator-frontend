import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, RefreshControl, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { getAllEstateUsers } from '@/src/lib/api/user';
import { useEffect, useState, useMemo } from 'react';
import { AllUsers, User } from '@/src/types/user';
import { UserRolesType } from '@/src/types/general';
import { sharedStyles } from '@/src/theme/styles';
import icons from '@/src/constants/icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Back from '@/src/components/mobile/Back';
import { getRoleIcon, getRoleIconHeight, getRoleIconWidth } from '@/src/lib/helpers';

const AllUsersMobile = () => {
	const [allFetchedUsers, setAllFetchedUsers] = useState<User[]>([]);
	const [visibleCount, setVisibleCount] = useState(10);
	const [isLoading, setIsLoading] = useState(true);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedRole, setSelectedRole] = useState<UserRolesType | 'admins' | 'unverified' | null>(null);
	const [isFetchingMore, setIsFetchingMore] = useState(false);
	const [hasUserScrolled, setHasUserScrolled] = useState(false);
	const navigation = useNavigation();

	const fetchUsers = async (showLoading = false) => {
		if (showLoading) setIsLoading(true);
		try {
			const data = await getAllEstateUsers(1, 100);
			setAllFetchedUsers(data.items);
		} catch (error) {
			console.log('Error fetching users:', error);
		} finally {
			if (showLoading) setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchUsers(true);
	}, []);

	useEffect(() => {
		const unsubscribe = navigation.addListener('focus', () => {
			fetchUsers(false);
		});
		return unsubscribe;
	}, [navigation]);

	const handleRefresh = async () => {
		setIsRefreshing(true);
		try {
			const data = await getAllEstateUsers(1, 100);
			setAllFetchedUsers(data.items);
		} catch (error) {
			console.log('Error refreshing users:', error);
		} finally {
			setIsRefreshing(false);
		}
	};

	const loadMore = () => {
		if (!isLoading && !isFetchingMore && visibleCount < filteredUsers.length) {
			setIsFetchingMore(true);
			setTimeout(() => {
				setVisibleCount((prev) => prev + 10);
				setIsFetchingMore(false);
			}, 300);
		}
	};

	const filteredUsers = useMemo(() => {
		return allFetchedUsers.filter((user) => {
			const matchesSearch = `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) || user.home_address?.toLowerCase().includes(searchQuery.toLowerCase());

			let matchesRole = false;
			if (selectedRole === 'admins') {
				matchesRole = user.status && ['admin', 'primary_admin'].includes(user.role);
			} else if (selectedRole === 'unverified') {
				matchesRole = !user.status;
			} else {
				matchesRole = !selectedRole ? user.status : (user.status && user.role === selectedRole);
			}

			return matchesSearch && matchesRole;
		});
	}, [allFetchedUsers, searchQuery, selectedRole]);

	useEffect(() => {
		setVisibleCount(10);
		setHasUserScrolled(false);
	}, [searchQuery, selectedRole]);

	const displayedUsers = useMemo(() => {
		return filteredUsers.slice(0, visibleCount);
	}, [filteredUsers, visibleCount]);

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
				<View className="flex-row gap-2 mb-6 w-full">
					<Pressable className={`flex-1 justify-center items-center py-3 rounded-2xl border ${selectedRole === 'resident' ? 'bg-orange/10 border-orange' : 'bg-white border-gray-300'}`} onPress={() => setSelectedRole(selectedRole === 'resident' ? null : 'resident')}>
						<Image source={icons.adminHomeIcon} style={{ width: 20, height: 20, opacity: selectedRole === 'resident' ? 1 : 0.4, tintColor: selectedRole === 'resident' ? undefined : '#999' }} />
					</Pressable>

					<Pressable className={`flex-1 justify-center items-center py-3 rounded-2xl border ${selectedRole === 'security' ? 'bg-teal/10 border-teal' : 'bg-white border-gray-300'}`} onPress={() => setSelectedRole(selectedRole === 'security' ? null : 'security')}>
						<Image source={icons.securityIcon} style={{ width: 20, height: 20, opacity: selectedRole === 'security' ? 1 : 0.4, tintColor: selectedRole === 'security' ? undefined : '#999' }} />
					</Pressable>

					<Pressable
						className={`flex-1 justify-center items-center py-3 rounded-2xl border ${selectedRole === 'admins' ? 'bg-primary/10 border-primary' : 'bg-white border-gray-300'}`}
						onPress={() => setSelectedRole(selectedRole === 'admins' ? null : 'admins')}
					>
						<Image source={icons.activeAdminIcon} style={{ width: 17, height: 20, opacity: selectedRole === 'admins' ? 1 : 0.4, tintColor: selectedRole === 'admins' ? undefined : '#999' }} />
					</Pressable>

					<Pressable
						className={`flex-1 justify-center items-center py-3 rounded-2xl border ${selectedRole === 'unverified' ? 'bg-red-500/10 border-red-500' : 'bg-white border-gray-300'}`}
						onPress={() => setSelectedRole(selectedRole === 'unverified' ? null : 'unverified')}
					>
						<Feather name="user-x" size={20} color={selectedRole === 'unverified' ? '#ef4444' : '#999'} />
					</Pressable>
				</View>
				{isLoading ? (
					<View className="flex-1 justify-center items-center py-10">
						<Text className="text-primary font-inter-regular">Loading users...</Text>
					</View>
				) : displayedUsers.length > 0 ? (
					<FlatList
						data={displayedUsers}
						keyExtractor={(item, index) => item.id ? `${item.id}-${index}` : index.toString()}
						contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 20 }}
						refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
						onScroll={() => setHasUserScrolled(true)}
						onEndReached={() => {
							if (hasUserScrolled) {
								loadMore();
							}
						}}
						onEndReachedThreshold={0.05}
						ListFooterComponent={isFetchingMore ? <ActivityIndicator size="small" color="#113E55" style={{ marginVertical: 20 }} /> : null}
						renderItem={({ item, index }) => (
							<TouchableOpacity className={`flex-row items-center py-4 ${index !== displayedUsers.length - 1 ? 'border-b border-gray-200' : ''}`} onPress={() => router.push({ pathname: '/(protected)/admin/users/[userId]', params: { userId: item.id!, userParam: JSON.stringify(item) } })}>
								<Image source={getRoleIcon(item.role)} style={{ width: getRoleIconWidth(item.role), height: getRoleIconHeight(item.role) }} />
								<View className="flex-1 ml-4">
									<Text className="text-primary text-lg font-inter-medium">{`${item.first_name} ${item.last_name}`}</Text>
									<Text className="text-gray-500 text-sm font-inter-regular mt-1">{item.home_address}</Text>
								</View>
								<Feather name="chevron-right" size={20} color="#1B998B" />
							</TouchableOpacity>
						)}
					/>
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
