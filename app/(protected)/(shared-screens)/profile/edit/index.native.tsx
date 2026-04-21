import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Toast, ToastType } from '@/src/components/mobile/Toast';
import { sharedStyles } from '@/src/theme/styles';
import { useUserStore } from '@/src/lib/stores/userStore';
import { createRequest, checkPendingRequests, updatePendingRequest } from '@/src/lib/api/requests';
import { RequestType, PendingRequestsResponse } from '@/src/types/requests';
import { useRouter } from 'expo-router';

interface ChangedField {
	type: RequestType;
	old: string;
	new: string;
	label: string;
}

export default function EditRequest() {
	const router = useRouter();
	const user = useUserStore.getState();

	const [formData, setFormData] = useState({
		firstName: user.first_name || '',
		lastName: user.last_name || '',
		email: user.email || '',
		address: user.home_address || '',
		phoneNumber: user.phone_number || '',
	});

	const [loading, setLoading] = useState(false);
	const [toastVisible, setToastVisible] = useState(false);
	const [toastMessage, setToastMessage] = useState('');
	const [toastType, setToastType] = useState<ToastType>('success');

	useEffect(() => {
		setFormData({
			firstName: user.first_name || '',
			lastName: user.last_name || '',
			email: user.email || '',
			address: user.home_address || '',
			phoneNumber: user.phone_number || '',
		});
	}, []);

	const handleSendRequest = async () => {
		setLoading(true);

		const pendingChecks: Promise<PendingRequestsResponse>[] = [];
		const changedFields: ChangedField[] = [];

		if (formData.firstName !== user.first_name) {
			changedFields.push({
				type: 'first_name_change' as const,
				old: user.first_name || '',
				new: formData.firstName,
				label: 'First Name',
			});
			pendingChecks.push(checkPendingRequests('first_name_change'));
		}

		if (formData.lastName !== user.last_name) {
			changedFields.push({
				type: 'last_name_change' as const,
				old: user.last_name || '',
				new: formData.lastName,
				label: 'Last Name',
			});
			pendingChecks.push(checkPendingRequests('last_name_change'));
		}

		if (formData.email !== user.email) {
			changedFields.push({
				type: 'email_change' as const,
				old: user.email || '',
				new: formData.email,
				label: 'Email Address',
			});
			pendingChecks.push(checkPendingRequests('email_change'));
		}

		if (formData.address !== user.home_address) {
			changedFields.push({
				type: 'home_address_change' as const,
				old: user.home_address || '',
				new: formData.address,
				label: 'Address',
			});
			pendingChecks.push(checkPendingRequests('home_address_change'));
		}

		if (formData.phoneNumber !== user.phone_number) {
			changedFields.push({
				type: 'phone_number_change' as const,
				old: user.phone_number || '',
				new: formData.phoneNumber,
				label: 'Phone Number',
			});
			pendingChecks.push(checkPendingRequests('phone_number_change' as RequestType));
		}

		if (changedFields.length === 0) {
			setToastMessage('No changes detected');
			setToastType('info');
			setToastVisible(true);
			setLoading(false);
			return;
		}

		try {
			const pendingResults = await Promise.allSettled(pendingChecks);
			const createRequests: ChangedField[] = [];
			const updateRequests: { field: ChangedField; requestId: string }[] = [];
			const errorMessages: string[] = [];

			pendingResults.forEach((result, index) => {
				if (result.status === 'fulfilled') {
					if (result.value.has_pending_request && result.value.pending_request) {
						updateRequests.push({ field: changedFields[index], requestId: result.value.pending_request.id });
					} else {
						createRequests.push(changedFields[index]);
					}
				} else {
					const error = result.reason;
					const errorMessage = error?.message || '';
					errorMessages.push(`Error checking ${changedFields[index].label}: ${errorMessage}`);
				}
			});

			if (errorMessages.length > 0) {
				setToastMessage(errorMessages[0]);
				setToastType('error');
				setToastVisible(true);
				setLoading(false);
				return;
			}

			const allRequests = [...createRequests, ...updateRequests.map((r) => r.field)];

			if (allRequests.length > 0) {
				try {
					await Promise.all([...createRequests.map((req) => createRequest(req.type as any, req.old, req.new)), ...updateRequests.map((req) => updatePendingRequest(req.requestId, req.field.new))]);

					const successMsg = allRequests.length === 1 ? '1 request submitted successfully. Awaiting admin approval.' : `${allRequests.length} requests submitted successfully. Awaiting admin approval.`;
					setToastMessage(successMsg);
					setToastType('success');
					setToastVisible(true);

					setTimeout(() => {
						router.back();
					}, 1500);
				} catch (submitErr: any) {
					const submitMessage = submitErr?.message || 'Failed to submit requests';
					setToastMessage(submitMessage);
					setToastType('error');
					setToastVisible(true);
				}
			} else {
				setToastMessage('No valid requests to submit');
				setToastType('info');
				setToastVisible(true);
			}
		} catch (err: any) {
			const message = err?.message || 'Failed to submit edit requests';
			setToastMessage(message);
			setToastType('error');
			setToastVisible(true);
		} finally {
			setLoading(false);
		}
	};

	return (
		<SafeAreaView style={[sharedStyles.container, sharedStyles.modalContainer]}>
			<Toast message={toastMessage} type={toastType} visible={toastVisible} onHide={() => setToastVisible(false)} />

			<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
				<Text className="text-grey mt-12 text-base font-inter font-medium mb-3">Send a request to change your details</Text>

				<Text style={sharedStyles.label}>First Name</Text>
				<TextInput style={sharedStyles.input} placeholder="Enter your first name" value={formData.firstName} onChangeText={(text) => setFormData({ ...formData, firstName: text })} editable={!loading} />

				<Text style={sharedStyles.label}>Last Name</Text>
				<TextInput style={sharedStyles.input} placeholder="Enter your last name" value={formData.lastName} onChangeText={(text) => setFormData({ ...formData, lastName: text })} editable={!loading} />

				<Text style={sharedStyles.label}>Email Address</Text>
				<TextInput style={sharedStyles.input} placeholder="Enter your email" keyboardType="email-address" autoCapitalize="none" value={formData.email} onChangeText={(text) => setFormData({ ...formData, email: text })} editable={!loading} />

				<Text style={sharedStyles.label}>Address</Text>
				<TextInput style={sharedStyles.input} placeholder="Enter your address" value={formData.address} onChangeText={(text) => setFormData({ ...formData, address: text })} editable={!loading} />

				<Text style={sharedStyles.label}>Phone Number</Text>
				<TextInput style={sharedStyles.input} placeholder="Enter your phone number" keyboardType="phone-pad" value={formData.phoneNumber} onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })} editable={!loading} />

				<View className="items-center mt-12 flex-row gap-3">
					{/* <TouchableOpacity className={`flex-1 px-6 bg-teal justify-center items-center py-5 rounded-xl ${loading ? 'opacity-70' : ''}`} onPress={() => router.back()} disabled={loading}>
						<Text className="text-white font-semibold text-md">Cancel</Text>
					</TouchableOpacity> */}

					<TouchableOpacity className={`flex-1 px-6 bg-primary justify-center items-center py-5 rounded-xl ${loading ? 'opacity-70' : ''}`} onPress={handleSendRequest} disabled={loading}>
						{loading ? <ActivityIndicator color="#fff" size="small" /> : <Text className="text-white font-semibold text-md">Send Request</Text>}
					</TouchableOpacity>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
