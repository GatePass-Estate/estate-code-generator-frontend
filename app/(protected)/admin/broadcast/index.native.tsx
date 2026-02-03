import Back from '@/src/components/mobile/Back';
import { Toast, ToastType } from '@/src/components/mobile/Toast';
import { sharedStyles } from '@/src/theme/styles';
import { useNavigation } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BroadcastFormData, BroadcastFormErrors, DURATIONS, PRIORITY_LEVELS, USER_TYPES } from '@/src/types/broadcast';

// Dummy API functions
const sendBroadcastAPI = async (data: BroadcastFormData): Promise<boolean> => {
	return new Promise((resolve) => {
		setTimeout(() => {
			console.log('Broadcasting:', data);
			resolve(Math.random() > 0.1); // 95% success rate
		}, 2000);
	});
};

const SendBroadcast = () => {
	const navigation = useNavigation();
	const [currentStep, setCurrentStep] = useState(1);
	const [formData, setFormData] = useState<BroadcastFormData>({
		userType: 'residents',
		priorityLevel: 'medium',
		duration: '24_hours',
		subjectLine: '',
		bodyText: '',
	});

	const [errors, setErrors] = useState<BroadcastFormErrors>({});
	const [loading, setLoading] = useState(false);
	const [toastVisible, setToastVisible] = useState(false);
	const [toastMessage, setToastMessage] = useState('');
	const [toastType, setToastType] = useState<ToastType>('success');
	const [isUserTypePickerVisible, setIsUserTypePickerVisible] = useState(false);
	const [isPriorityPickerVisible, setIsPriorityPickerVisible] = useState(false);
	const [isDurationPickerVisible, setIsDurationPickerVisible] = useState(false);

	// Handle custom back navigation
	useEffect(() => {
		const unsubscribe = navigation.addListener('beforeRemove', (e) => {
			e.preventDefault();

			if (currentStep === 2) {
				// Go back to step 1 instead of exiting
				setCurrentStep(1);
				setErrors({});
			} else {
				// Exit the screen norm
				navigation.dispatch(e.data.action);
			}
		});

		return unsubscribe;
	}, [navigation, currentStep]);

	const validateStep1 = (): boolean => {
		const newErrors: BroadcastFormErrors = {};

		if (!formData.userType) newErrors.userType = 'User type is required';
		if (!formData.priorityLevel) newErrors.priorityLevel = 'Priority level is required';
		if (!formData.duration) newErrors.duration = 'Duration is required';

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const validateStep2 = (): boolean => {
		const newErrors: BroadcastFormErrors = {};

		if (!formData.subjectLine.trim()) newErrors.subjectLine = 'Subject line is required';
		if (!formData.bodyText.trim()) newErrors.bodyText = 'Body text is required';

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleContinue = () => {
		if (currentStep === 1) {
			if (validateStep1()) {
				setCurrentStep(2);
				setErrors({});
			}
		} else if (currentStep === 2) {
			if (validateStep2()) {
				handleSendBroadcast();
			}
		}
	};

	const handleSendBroadcast = async () => {
		setLoading(true);

		try {
			const success = await sendBroadcastAPI(formData);

			if (success) {
				setToastMessage('Broadcast sent successfully!');
				setToastType('success');
				setToastVisible(true);

				// Reset form
				setFormData({
					userType: 'residents',
					priorityLevel: 'medium',
					duration: '24_hours',
					subjectLine: '',
					bodyText: '',
				});
				setCurrentStep(1);
				setErrors({});

				setTimeout(() => {
					navigation.goBack();
				}, 2000);
			} else {
				setToastMessage('Failed to send broadcast. Please try again.');
				setToastType('error');
				setToastVisible(true);
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'An error occurred while sending broadcast';
			setToastMessage(errorMessage);
			setToastType('error');
			setToastVisible(true);
		} finally {
			setLoading(false);
		}
	};

	const updateFormData = (key: keyof BroadcastFormData, value: string) => {
		setFormData((prev) => ({ ...prev, [key]: value }));
		if (errors[key as keyof BroadcastFormErrors]) {
			setErrors((prev) => ({ ...prev, [key]: undefined }));
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

			<Text
				className="text-2xl mt-10 font-ubuntu-bold text-primary"
				style={{
					fontSize: 23,
				}}
			>
				{currentStep === 1 ? 'Set Broadcast' : 'Send a broadcast'}
			</Text>

			<Toast message={toastMessage} type={toastType} visible={toastVisible} onHide={() => setToastVisible(false)} />

			<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
				<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
					{currentStep === 1 ? (
						<>
							{/* Type of User Dropdown */}
							<View className="mb-5 mt-6">
								<Text
									style={[
										sharedStyles.label,
										{
											color: '#9B9797',
										},
									]}
								>
									Type of User
								</Text>
								{Platform.OS === 'ios' ? (
									<>
										<Pressable style={sharedStyles.input} onPress={() => setIsUserTypePickerVisible(true)}>
											<Text style={{ color: formData.userType ? '#000' : '#9CA3AF' }}>{USER_TYPES.find((item) => item.value === formData.userType)?.label || 'Select user type'}</Text>
										</Pressable>
										<Modal transparent={true} visible={isUserTypePickerVisible} animationType="slide" onRequestClose={() => setIsUserTypePickerVisible(false)}>
											<Pressable style={styles.modalOverlay} onPress={() => setIsUserTypePickerVisible(false)}>
												<View className="bg-gray-800">
													<Picker
														selectedValue={formData.userType}
														onValueChange={(itemValue) => {
															updateFormData('userType', itemValue);
															setIsUserTypePickerVisible(false);
														}}
														className="text-gray-300 h-14 w-full"
													>
														{USER_TYPES.map((item) => (
															<Picker.Item key={item.value} label={item.label} value={item.value} />
														))}
													</Picker>
												</View>
											</Pressable>
										</Modal>
									</>
								) : (
									<View style={sharedStyles.input}>
										<Picker selectedValue={formData.userType} onValueChange={(value) => updateFormData('userType', value)} className="text-gray-300 h-14 w-full text-sm" style={{ color: 'gray' }}>
											{USER_TYPES.map((item) => (
												<Picker.Item key={item.value} label={item.label} value={item.value} />
											))}
										</Picker>
									</View>
								)}
								{errors.userType && <Text className="text-red-600 text-xs font-ubuntu-regular mt-1">{errors.userType}</Text>}
							</View>

							{/* Priority Level Dropdown */}
							<View className="mb-5">
								<Text
									style={[
										sharedStyles.label,
										{
											color: '#9B9797',
										},
									]}
								>
									Set Priority Level
								</Text>
								{Platform.OS === 'ios' ? (
									<>
										<Pressable style={sharedStyles.input} onPress={() => setIsPriorityPickerVisible(true)}>
											<Text style={{ color: formData.priorityLevel ? '#000' : '#9CA3AF' }}>{PRIORITY_LEVELS.find((item) => item.value === formData.priorityLevel)?.label || 'Select priority level'}</Text>
										</Pressable>
										<Modal transparent={true} visible={isPriorityPickerVisible} animationType="slide" onRequestClose={() => setIsPriorityPickerVisible(false)}>
											<Pressable style={styles.modalOverlay} onPress={() => setIsPriorityPickerVisible(false)}>
												<View className="bg-gray-800">
													<Picker
														selectedValue={formData.priorityLevel}
														onValueChange={(itemValue) => {
															updateFormData('priorityLevel', itemValue);
															setIsPriorityPickerVisible(false);
														}}
														className="text-gray-300 h-14 w-full"
													>
														{PRIORITY_LEVELS.map((item) => (
															<Picker.Item key={item.value} label={item.label} value={item.value} />
														))}
													</Picker>
												</View>
											</Pressable>
										</Modal>
									</>
								) : (
									<View style={sharedStyles.input}>
										<Picker selectedValue={formData.priorityLevel} onValueChange={(value) => updateFormData('priorityLevel', value)} className="text-gray-300 h-14 w-full text-sm" style={{ color: 'gray' }}>
											{PRIORITY_LEVELS.map((item) => (
												<Picker.Item key={item.value} label={item.label} value={item.value} />
											))}
										</Picker>
									</View>
								)}
								{errors.priorityLevel && <Text className="text-red-600 text-xs font-ubuntu-regular mt-1">{errors.priorityLevel}</Text>}
							</View>

							{/* Duration Dropdown */}
							<View className="mb-8">
								<Text
									style={[
										sharedStyles.label,
										{
											color: '#9B9797',
										},
									]}
								>
									Set Duration
								</Text>
								{Platform.OS === 'ios' ? (
									<>
										<Pressable style={sharedStyles.input} onPress={() => setIsDurationPickerVisible(true)}>
											<Text style={{ color: formData.duration ? '#000' : '#9CA3AF' }}>{DURATIONS.find((item) => item.value === formData.duration)?.label || 'Select duration'}</Text>
										</Pressable>
										<Modal transparent={true} visible={isDurationPickerVisible} animationType="slide" onRequestClose={() => setIsDurationPickerVisible(false)}>
											<Pressable style={styles.modalOverlay} onPress={() => setIsDurationPickerVisible(false)}>
												<View className="bg-gray-800">
													<Picker
														selectedValue={formData.duration}
														onValueChange={(itemValue) => {
															updateFormData('duration', itemValue);
															setIsDurationPickerVisible(false);
														}}
														className="text-gray-300 h-14 w-full"
													>
														{DURATIONS.map((item) => (
															<Picker.Item key={item.value} label={item.label} value={item.value} />
														))}
													</Picker>
												</View>
											</Pressable>
										</Modal>
									</>
								) : (
									<View style={sharedStyles.input}>
										<Picker selectedValue={formData.duration} onValueChange={(value) => updateFormData('duration', value)} className="text-gray-300 h-14 w-full text-sm" style={{ color: 'gray' }}>
											{DURATIONS.map((item) => (
												<Picker.Item key={item.value} label={item.label} value={item.value} />
											))}
										</Picker>
									</View>
								)}
								{errors.duration && <Text className="text-red-600 text-xs font-ubuntu-regular mt-1">{errors.duration}</Text>}
							</View>

							<TouchableOpacity disabled={loading} onPress={handleContinue} className={`bg-primary justify-center items-center py-5 rounded-xl ${loading ? 'opacity-70' : ''}`} activeOpacity={0.8}>
								<Text className="text-white font-ubuntu-semibold text-md">Continue</Text>
							</TouchableOpacity>
						</>
					) : (
						<>
							{/* Subject Line */}
							<View className="mb-5 mt-6">
								<Text
									style={[
										sharedStyles.label,
										{
											color: '#9B9797',
										},
									]}
								>
									Enter Subject Line
								</Text>
								<TextInput placeholder="Enter Subject Line" placeholderTextColor="#999" value={formData.subjectLine} onChangeText={(value) => updateFormData('subjectLine', value)} style={[sharedStyles.input, { borderColor: errors.subjectLine ? '#ef4444' : undefined }]} />
								{errors.subjectLine && <Text className="text-red-600 text-xs font-ubuntu-regular mt-1">{errors.subjectLine}</Text>}
							</View>

							{/* Body Text */}
							<View className="mb-8">
								<Text
									style={[
										sharedStyles.label,
										{
											color: '#9B9797',
										},
									]}
								>
									Enter Body Text
								</Text>
								<TextInput
									placeholder="Enter body Text"
									placeholderTextColor="#999"
									value={formData.bodyText}
									onChangeText={(value) => updateFormData('bodyText', value)}
									multiline
									numberOfLines={6}
									textAlignVertical="top"
									style={[sharedStyles.input, { borderColor: errors.bodyText ? '#ef4444' : undefined, minHeight: 150 }]}
								/>
								{errors.bodyText && <Text className="text-red-600 text-xs font-ubuntu-regular mt-1">{errors.bodyText}</Text>}
							</View>

							<TouchableOpacity disabled={loading} onPress={handleContinue} className={`bg-primary justify-center items-center py-5 rounded-xl ${loading ? 'opacity-70' : ''} gap-2 flex-row`} activeOpacity={0.8}>
								{loading && <ActivityIndicator color="#fff" size="small" />}
								<Text className="text-white font-ubuntu-semibold text-md">{loading ? 'Sending Broadcast...' : 'Send Broadcast'}</Text>
							</TouchableOpacity>
						</>
					)}
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'flex-end',
	},
});

export default SendBroadcast;
