import Back from '@/src/components/mobile/Back';
import { Toast, ToastType } from '@/src/components/mobile/Toast';
import { approveRequests, declineRequests, getRequests } from '@/src/lib/api/requests';
import { sharedStyles } from '@/src/theme/styles';
import { EditRequestView } from '@/src/types/requests';
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

const fetchEditRequests = async (): Promise<EditRequestView[]> => {
	try {
		const data = await getRequests(1, 10, 'approved');
		return data.items.map((item) => ({
			id: item.id,
			userName: item.resident_id || 'Unknown User',
			location: item.estate_id || 'Unknown Location',
			selected: false,
		}));
	} catch (error) {
		return [];
	}
};

const EditRequestMobile = () => {
	const [requests, setRequests] = useState<EditRequestView[]>([]);
	const [loading, setLoading] = useState(true);
	const [processing, setProcessing] = useState(false);
	const [toastVisible, setToastVisible] = useState(false);
	const [toastMessage, setToastMessage] = useState('');
	const [toastType, setToastType] = useState<ToastType>('success');

	useEffect(() => {
		const loadRequests = async () => {
			try {
				const data = await fetchEditRequests();
				setRequests(data);
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Failed to load edit requests';
				setToastMessage(errorMessage);
				setToastType('error');
				setToastVisible(true);
			} finally {
				setLoading(false);
			}
		};

		loadRequests();
	}, []);

	const toggleSelection = (id: string) => {
		setRequests((prev) => prev.map((request) => (request.id === id ? { ...request, selected: !request.selected } : request)));
	};

	const toggleSelectAll = () => {
		const allSelected = requests.every((r) => r.selected);
		setRequests((prev) => prev.map((request) => ({ ...request, selected: !allSelected })));
	};

	const selectedRequests = requests.filter((r) => r.selected);
	const allSelected = requests.length > 0 && requests.every((r) => r.selected);

	const handleApprove = async () => {
		if (selectedRequests.length === 0) {
			setToastMessage('Please select at least one request to approve');
			setToastType('info');
			setToastVisible(true);
			return;
		}

		setProcessing(true);

		try {
			const success = await approveRequests(selectedRequests.map((r) => r.id));

			if (success) {
				setToastMessage(`${selectedRequests.length} request(s) approved successfully!`);
				setToastType('success');
				setToastVisible(true);

				// Remove approved requests from list
				setRequests((prev) => prev.filter((r) => !r.selected));
			} else {
				setToastMessage('Failed to approve requests. Please try again.');
				setToastType('error');
				setToastVisible(true);
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'An error occurred while approving requests';
			setToastMessage(errorMessage);
			setToastType('error');
			setToastVisible(true);
		} finally {
			setProcessing(false);
		}
	};

	const handleDecline = async () => {
		if (selectedRequests.length === 0) {
			setToastMessage('Please select at least one request to decline');
			setToastType('info');
			setToastVisible(true);
			return;
		}

		setProcessing(true);

		try {
			const success = await declineRequests(selectedRequests.map((r) => r.id));

			if (success) {
				setToastMessage(`${selectedRequests.length} request(s) declined successfully!`);
				setToastType('success');
				setToastVisible(true);

				// Remove declined requests from list
				setRequests((prev) => prev.filter((r) => !r.selected));
			} else {
				setToastMessage('Failed to decline requests. Please try again.');
				setToastType('error');
				setToastVisible(true);
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'An error occurred while declining requests';
			setToastMessage(errorMessage);
			setToastType('error');
			setToastVisible(true);
		} finally {
			setProcessing(false);
		}
	};

	if (loading) {
		return (
			<SafeAreaView style={[sharedStyles.container, sharedStyles.modalContainer, { flex: 1 }]}>
				<Stack.Screen
					options={{
						headerShown: false,
						headerShadowVisible: false,
					}}
				/>

				<Back type="short-arrow" />

				<Text className="text-2xl mt-10 font-ubuntu-bold text-primary mb-8">Edit Request</Text>

				<View className="flex-1 justify-center items-center">
					<ActivityIndicator size="large" color="#113E55" />
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={[sharedStyles.container, sharedStyles.modalContainer, { paddingBottom: 50, flex: 1 }]}>
			<Stack.Screen
				options={{
					headerShown: false,
					headerShadowVisible: false,
				}}
			/>

			<Back type="short-arrow" />

			<Text className="text-2xl mt-10 font-ubuntu-bold text-primary mb-6">Edit Request</Text>

			<Toast message={toastMessage} type={toastType} visible={toastVisible} onHide={() => setToastVisible(false)} />

			{requests.length === 0 ? (
				<View className="flex-1 justify-center items-center">
					<Text className="text-grey text-center text-base font-ubuntu-medium">No edit requests at the moment</Text>
				</View>
			) : (
				<>
					<Pressable onPress={toggleSelectAll} className="flex-row items-center gap-3 p-3 pl-0 bg-grey-50 rounded-lg">
						<View className={`w-6 h-6 rounded border-2 border-grey items-center justify-center ${allSelected ? 'bg-grey' : 'bg-white'}`}>{allSelected && <Icon name="checkmark" size={16} color="#fff" />}</View>
						<Text className="text-grey font-ubuntu-semibold flex-1">{allSelected ? 'Deselect All' : 'Select All'}</Text>
					</Pressable>

					<FlatList
						data={requests}
						keyExtractor={(item) => item.id}
						scrollEnabled={true}
						renderItem={({ item }) => (
							<View className="flex-row items-center gap-3 my-5 rounded-lg active:bg-grey-50">
								<Pressable onPress={() => toggleSelection(item.id)} className={`w-6 h-6 rounded border-2 border-grey items-center justify-center ${item.selected ? 'bg-grey' : 'bg-white'}`}>
									{item.selected && <Icon name="checkmark" size={16} color="#fff" />}
								</Pressable>

								<View className="flex-1">
									<Text className="text-grey font-inter-regular text-md">{item.userName}</Text>
									<Text className="text-grey text-sm font-inter-regular">{item.location}</Text>
								</View>

								<Pressable onPress={() => router.push(`/admin/edit-requests/${item.id}`)} className="p-2">
									<Icon name="chevron-forward" size={24} color="#1B998B" />
								</Pressable>
							</View>
						)}
					/>

					<View className="flex-row gap-3 mt-8">
						<TouchableOpacity disabled={processing} onPress={handleDecline} className={`flex-1 bg-teal justify-center items-center py-6 rounded-xl ${processing ? 'opacity-70' : ''}`} activeOpacity={0.8}>
							{processing ? <ActivityIndicator color="#fff" size="small" /> : <Text className="text-white font-ubuntu-semibold text-md">Decline</Text>}
						</TouchableOpacity>

						<TouchableOpacity disabled={processing} onPress={handleApprove} className={`flex-1 bg-primary justify-center items-center py-6 rounded-xl ${processing ? 'opacity-70' : ''}`} activeOpacity={0.8}>
							{processing ? <ActivityIndicator color="#fff" size="small" /> : <Text className="text-white font-ubuntu-semibold text-md">Approve</Text>}
						</TouchableOpacity>
					</View>
				</>
			)}
		</SafeAreaView>
	);
};

export default EditRequestMobile;
