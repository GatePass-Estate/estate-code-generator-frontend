import Back from '@/src/components/mobile/Back';
import { SingleDetail } from '@/src/components/mobile/SIngleDetail';
import { Toast, ToastType } from '@/src/components/mobile/Toast';
import { sharedStyles } from '@/src/theme/styles';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface EditRequestData {
	id: string;
	userName: string;
	oldData: {
		name: string;
		address: string;
		email: string;
		phoneNumber: string;
	};
	newData: {
		name: string;
		address: string;
		email: string;
		phoneNumber: string;
	};
}

// Dummy API functions
const fetchEditRequest = async (requestId: string): Promise<EditRequestData> => {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve({
				id: requestId,
				userName: 'Sandra Happiness',
				oldData: {
					name: 'Sandra Happiness',
					address: 'Flat 1, 18A Olayinka Something Street, U3 Estate',
					email: 'sandarons@hot.com',
					phoneNumber: '0907 345 289',
				},
				newData: {
					name: 'Sandra Happiness',
					address: 'Flat 1, 18A Olayinka Something Street, U3 Estate',
					email: 'sandarons@hot.com',
					phoneNumber: '0907 345 289',
				},
			});
		}, 1500);
	});
};

const approveEditRequest = async (requestId: string): Promise<boolean> => {
	return new Promise((resolve) => {
		setTimeout(() => {
			console.log('Approving edit request:', requestId);
			resolve(Math.random() > 0.1); // 90% success rate
		}, 1500);
	});
};

const declineEditRequest = async (requestId: string): Promise<boolean> => {
	return new Promise((resolve) => {
		setTimeout(() => {
			console.log('Declining edit request:', requestId);
			resolve(Math.random() > 0.1); // 90% success rate
		}, 1500);
	});
};

export default function EditSingleRequestMobile() {
	const { requestId } = useLocalSearchParams();
	const [loading, setLoading] = useState(true);
	const [processing, setProcessing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [requestData, setRequestData] = useState<EditRequestData | null>(null);
	const [toastVisible, setToastVisible] = useState(false);
	const [toastMessage, setToastMessage] = useState('');
	const [toastType, setToastType] = useState<ToastType>('success');

	useEffect(() => {
		const loadRequest = async () => {
			try {
				setLoading(true);
				setError(null);
				const data = await fetchEditRequest(requestId as string);

				if (!data) {
					setError('Edit request not found');
				} else {
					setRequestData(data);
				}
			} catch (err) {
				console.error('Error fetching edit request:', err);
				setError(err instanceof Error ? err.message : 'Failed to load edit request');
			} finally {
				setLoading(false);
			}
		};

		loadRequest();
	}, [requestId]);

	const handleApprove = async () => {
		setProcessing(true);

		try {
			const success = await approveEditRequest(requestId as string);

			if (success) {
				setToastMessage('Edit request approved successfully!');
				setToastType('success');
				setToastVisible(true);

				setTimeout(() => {
					// Navigate back after success
				}, 2000);
			} else {
				setToastMessage('Failed to approve request. Please try again.');
				setToastType('error');
				setToastVisible(true);
			}
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'An error occurred while approving request';
			setToastMessage(errorMessage);
			setToastType('error');
			setToastVisible(true);
		} finally {
			setProcessing(false);
		}
	};

	const handleDecline = async () => {
		setProcessing(true);

		try {
			const success = await declineEditRequest(requestId as string);

			if (success) {
				setToastMessage('Edit request declined successfully!');
				setToastType('success');
				setToastVisible(true);

				setTimeout(() => {
					// Navigate back after success
				}, 2000);
			} else {
				setToastMessage('Failed to decline request. Please try again.');
				setToastType('error');
				setToastVisible(true);
			}
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'An error occurred while declining request';
			setToastMessage(errorMessage);
			setToastType('error');
			setToastVisible(true);
		} finally {
			setProcessing(false);
		}
	};

	return (
		<SafeAreaView style={[sharedStyles.container, sharedStyles.modalContainer, { paddingBottom: 50, flex: 1 }]}>
			<Stack.Screen
				options={{
					headerShown: false,
					headerShadowVisible: false,
				}}
			/>

			<Back type="short-arrow" />

			<Toast message={toastMessage} type={toastType} visible={toastVisible} onHide={() => setToastVisible(false)} />

			{loading ? (
				<View className="flex-1 justify-center items-center">
					<ActivityIndicator size="large" color="#113E55" />
				</View>
			) : error ? (
				<View className="flex-1 justify-center items-center px-4">
					<View className="bg-red-50 border border-red-200 rounded-lg p-4 items-center">
						<Text className="text-red-800 font-ubuntu-semibold text-center mb-3">Error Loading Request</Text>
						<Text className="text-red-600 text-center mb-4">{error}</Text>
						<TouchableOpacity
							className="bg-red-600 px-6 py-2 rounded-lg"
							onPress={() => {
								const loadRequest = async () => {
									try {
										setLoading(true);
										setError(null);
										const data = await fetchEditRequest(requestId as string);
										if (data) {
											setRequestData(data);
										} else {
											setError('Edit request not found');
										}
									} catch (err) {
										setError(err instanceof Error ? err.message : 'Failed to load edit request');
									} finally {
										setLoading(false);
									}
								};
								loadRequest();
							}}
						>
							<Text className="text-white font-ubuntu-semibold">Retry</Text>
						</TouchableOpacity>
					</View>
				</View>
			) : requestData ? (
				<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 40 }}>
					<View className="flex-1">
						<View className="mb-6">
							<View className="bg-light-grey p-4 rounded-lg border border-grey/50">
								<SingleDetail label="Name" value={requestData.oldData.name} />
								<SingleDetail label="Address" value={requestData.oldData.address} />
								<SingleDetail label="Email Address" value={requestData.oldData.email} />
								<SingleDetail label="Phone Number" value={requestData.oldData.phoneNumber} />
							</View>
						</View>

						<View className="mb-8">
							<View className="bg-light-teal p-4 rounded-lg border border-teal/40">
								<SingleDetail label="Name" value={requestData.newData.name} />
								<SingleDetail label="Address" value={requestData.newData.address} />
								<SingleDetail label="Email Address" value={requestData.newData.email} />
								<SingleDetail label="Phone Number" value={requestData.newData.phoneNumber} />
							</View>
						</View>
					</View>

					<View className="flex-row gap-4">
						<TouchableOpacity disabled={processing} onPress={handleDecline} className={`flex-1 bg-teal justify-center items-center py-6 rounded-xl ${processing ? 'opacity-70' : ''}`} activeOpacity={0.8}>
							{processing ? <ActivityIndicator color="#fff" size="small" /> : <Text className="text-white font-ubuntu-semibold text-md">Decline</Text>}
						</TouchableOpacity>

						<TouchableOpacity disabled={processing} onPress={handleApprove} className={`flex-1 bg-primary justify-center items-center py-6 rounded-xl ${processing ? 'opacity-70' : ''}`} activeOpacity={0.8}>
							{processing ? <ActivityIndicator color="#fff" size="small" /> : <Text className="text-white font-ubuntu-semibold text-md">Approve</Text>}
						</TouchableOpacity>
					</View>
				</ScrollView>
			) : null}
		</SafeAreaView>
	);
}
