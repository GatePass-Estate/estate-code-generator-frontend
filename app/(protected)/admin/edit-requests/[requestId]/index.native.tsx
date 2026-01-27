import Back from '@/src/components/mobile/Back';
import { SingleDetail } from '@/src/components/mobile/SIngleDetail';
import { Toast, ToastType } from '@/src/components/mobile/Toast';
import { getRequestById, approveRequests, declineRequests } from '@/src/lib/api/requests';
import { sharedStyles } from '@/src/theme/styles';
import { RequestItem, RequestType } from '@/src/types/requests';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const getFieldLabelFromType = (type: RequestType): string => {
	const labels: Record<RequestType, string> = {
		first_name_change: 'First Name',
		last_name_change: 'Last Name',
		email_change: 'Email Address',
		home_address_change: 'Address',
		gender_change: 'Gender',
		vacate_residence: 'Vacate Residence',
		phone_number_change: 'Phone Number',
	};
	return labels[type] || 'Unknown Field';
};

export default function EditSingleRequestMobile() {
	const { requestId } = useLocalSearchParams();
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [processing, setProcessing] = useState(false);
	const [processingAction, setProcessingAction] = useState<'approve' | 'decline' | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [requestData, setRequestData] = useState<RequestItem | null>(null);
	const [toastVisible, setToastVisible] = useState(false);
	const [toastMessage, setToastMessage] = useState('');
	const [toastType, setToastType] = useState<ToastType>('success');

	useEffect(() => {
		const loadRequest = async () => {
			try {
				setLoading(true);
				setError(null);
				const data = await getRequestById(requestId as string);

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
		if (!requestData?.new_value) {
			setToastMessage('Cannot approve request: new value is missing');
			setToastType('error');
			setToastVisible(true);
			return;
		}

		setProcessing(true);
		setProcessingAction('approve');

		try {
			console.log(requestId);

			const response = await approveRequests(requestId as string);

			if (response && response.id) {
				setToastMessage('Edit request approved successfully!');
				setToastType('success');
				setToastVisible(true);

				setTimeout(() => {
					router.back();
				}, 1500);
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
			setProcessingAction(null);
		}
	};

	const handleDecline = async () => {
		setProcessing(true);
		setProcessingAction('decline');

		try {
			const response = await declineRequests(requestId as string);

			if (response && response.id) {
				setToastMessage('Edit request declined successfully!');
				setToastType('success');
				setToastVisible(true);

				setTimeout(() => {
					router.back();
				}, 1500);
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
			setProcessingAction(null);
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
										const data = await getRequestById(requestId as string);
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
					<View className="flex-1 mb-8">
						<Text className="text-lg font-ubuntu-semibold text-primary mb-4">Current Value</Text>
						<View className="bg-light-grey p-4 rounded-lg border border-grey/50">
							<SingleDetail label={getFieldLabelFromType(requestData.request_type)} value={requestData.old_value} contentColor="text-grey" />
						</View>
					</View>

					<View className="flex-1 mb-8">
						<Text className="text-lg font-ubuntu-semibold text-primary mb-4">Requested New Value</Text>
						<View className="bg-light-teal p-4 rounded-lg border border-teal/40">
							<SingleDetail label={getFieldLabelFromType(requestData.request_type)} value={requestData.new_value || 'N/A'} />
						</View>
					</View>

					<View className="flex-row gap-4">
						<TouchableOpacity disabled={processing} onPress={handleDecline} className={`flex-1 bg-teal justify-center items-center py-6 rounded-xl ${processing ? 'opacity-70' : ''}`} activeOpacity={0.8}>
							{processingAction === 'decline' ? <ActivityIndicator color="#fff" size="small" /> : <Text className="text-white font-ubuntu-semibold text-md">Decline</Text>}
						</TouchableOpacity>

						<TouchableOpacity disabled={processing} onPress={handleApprove} className={`flex-1 bg-primary justify-center items-center py-6 rounded-xl ${processing ? 'opacity-70' : ''}`} activeOpacity={0.8}>
							{processingAction === 'approve' ? <ActivityIndicator color="#fff" size="small" /> : <Text className="text-white font-ubuntu-semibold text-md">Approve</Text>}
						</TouchableOpacity>
					</View>
				</ScrollView>
			) : null}
		</SafeAreaView>
	);
}
