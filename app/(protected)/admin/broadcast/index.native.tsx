import Back from '@/src/components/mobile/Back';
import { Toast, ToastType } from '@/src/components/mobile/Toast';
import { sharedStyles } from '@/src/theme/styles';
import { useNavigation } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BroadcastFormData, BroadcastFormErrors, DURATIONS, PRIORITY_LEVELS, USER_TYPES } from '@/src/types/broadcast';
import { Picker } from '@/src/components/mobile/Picker';

// Dummy API functions
const sendBroadcastAPI = async (data: BroadcastFormData): Promise<boolean> => {
	return new Promise((resolve) => {
		setTimeout(() => {
			console.log('Broadcasting:', data);
			resolve(Math.random() > 0.1); // 95% success rate
		}, 2000);
	});
};

const BroadcastMobile = () => {
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

	// Handle custom back navigation
	useEffect(() => {
		const unsubscribe = navigation.addListener('beforeRemove', (e) => {
			e.preventDefault();

			if (currentStep === 2) {
				// Go back to step 1 instead of exiting
				setCurrentStep(1);
				setErrors({});
			} else {
				// Exit the screen normally
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
								<Picker label="Type of User" selectedValue={formData.userType} onValueChange={(value: string) => updateFormData('userType', value)} placeholder="Select user type" items={USER_TYPES} />
								{errors.userType && <Text className="text-red-600 text-xs font-ubuntu-regular mt-1">{errors.userType}</Text>}
							</View>

							{/* Priority Level Dropdown */}
							<View className="mb-5">
								<Picker label="Set Priority Level" selectedValue={formData.priorityLevel} onValueChange={(value: string) => updateFormData('priorityLevel', value)} placeholder="Select priority level" items={PRIORITY_LEVELS} />
								{errors.priorityLevel && <Text className="text-red-600 text-xs font-ubuntu-regular mt-1">{errors.priorityLevel}</Text>}
							</View>

							{/* Duration Dropdown */}
							<View className="mb-8">
								<Picker label="Set Duration" selectedValue={formData.duration} onValueChange={(value: string) => updateFormData('duration', value)} placeholder="Select duration" items={DURATIONS} />
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

export default BroadcastMobile;
