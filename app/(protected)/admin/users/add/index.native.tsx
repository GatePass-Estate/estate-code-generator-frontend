import Back from '@/src/components/mobile/Back';
import { sharedStyles } from '@/src/theme/styles';
import { Stack, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FormData, FormErrors, MeansOfIdType } from '@/src/types/general';
import { activateUser, registerUser } from '@/src/lib/api/user';
import { useUserStore } from '@/src/lib/stores/userStore';
import { Toast, ToastType } from '@/src/components/mobile/Toast';
import { RegisterUserPayload } from '@/src/types/user';
import { useNavigation } from '@react-navigation/native';
import icons from '@/src/constants/icons';

const MEANS_OF_IDENTIFICATION: { label: string; value: MeansOfIdType }[] = [
	{ label: 'Drivers License', value: 'drivers_license' },
	{ label: 'International Passport', value: 'international_passport' },
	{ label: 'National Identification Number', value: 'national_id' },
	{ label: 'Voters Card', value: 'voters_card' },
];

const RegisterUser = () => {
	const router = useRouter();
	const navigation = useNavigation();
	const [currentStep, setCurrentStep] = useState(1);
	const [formData, setFormData] = useState<FormData>({
		firstName: '',
		lastName: '',
		email: '',
		phoneNumber: '',
		password: 'NewPowerfulPassword',
		userType: 'resident',
		homeAddress: '',
		meansOfIdentification: 'drivers_license',
	});

	const [errors, setErrors] = useState<FormErrors>({});
	const [loading, setLoading] = useState(false);
	const [toastVisible, setToastVisible] = useState(false);
	const [toastMessage, setToastMessage] = useState('');
	const [toastType, setToastType] = useState<ToastType>('success');
	const [isUserTypePickerVisible, setIsUserTypePickerVisible] = useState(false);
	const [isMeansOfIdPickerVisible, setIsMeansOfIdPickerVisible] = useState(false);
	const [showPassword, setShowPassword] = useState(false);

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
		const newErrors: FormErrors = {};

		if (!formData.firstName.trim()) newErrors.firstName = 'Name is required';
		if (!formData.email.trim()) newErrors.email = 'Email is required';
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';

		if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
		if (!formData.password.trim()) newErrors.password = 'Password is required';
		else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const validateStep2 = (): boolean => {
		const newErrors: FormErrors = {};

		if (!formData.homeAddress.trim()) newErrors.homeAddress = 'House address is required';

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
				handleSaveUser();
			}
		}
	};

	const handleSaveUser = async () => {
		setLoading(true);

		const { estate_id } = useUserStore.getState();

		try {
			const payload: RegisterUserPayload = {
				first_name: formData.firstName,
				last_name: formData.lastName,
				email: formData.email,
				phone_number: formData.phoneNumber,
				role: formData.userType,
				gender: 'prefer_not_to_say',
				estate_id: estate_id || '',
				home_address: formData.homeAddress,
				household_id: null,
			};
			console.log(payload);

			const regiteredUser = await registerUser(payload);

			if (regiteredUser && regiteredUser.id) {
				const activatedUser = await activateUser({
					user_id: regiteredUser.id,
					new_password: formData.password,
				});

				if (activatedUser) {
					setToastMessage('User registered and activated successfully!');
					setToastType('success');
					setToastVisible(true);
					// Reset form
					setFormData({
						firstName: '',
						lastName: '',
						email: '',
						phoneNumber: '',
						password: '',
						userType: 'resident',
						homeAddress: '',
						meansOfIdentification: 'drivers_license',
					});
					setCurrentStep(1);
					setErrors({});
					setTimeout(() => {
						router.back();
					}, 2000);
				} else {
					setToastMessage('User registered but activation failed. Please try again.');
					setToastType('error');
					setToastVisible(true);
				}
			} else {
				setToastMessage('Failed to register user. Please try again.');
				setToastType('error');
				setToastVisible(true);
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'An error occurred while registering user';
			setToastMessage(errorMessage);
			setToastType('error');
			setToastVisible(true);
		} finally {
			setLoading(false);
		}
	};

	const updateFormData = (key: keyof FormData, value: string) => {
		setFormData((prev) => ({ ...prev, [key]: value }));
		if (errors[key as keyof FormErrors]) {
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
				Register User
			</Text>

			<Toast message={toastMessage} type={toastType} visible={toastVisible} onHide={() => setToastVisible(false)} />

			<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
				<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
					{currentStep === 1 ? (
						<>
							<View className="mb-2">
								<Text
									style={[
										sharedStyles.label,
										{
											color: '#9B9797',
										},
									]}
								>
									First Name
								</Text>
								<TextInput placeholder="Enter first name..." placeholderTextColor="#999" value={formData.firstName} onChangeText={(value) => updateFormData('firstName', value)} style={[sharedStyles.input, { borderColor: errors.firstName ? '#ef4444' : undefined }]} />
								{errors.firstName && <Text className="text-red-600 text-xs font-ubuntu-regular mt-1">{errors.firstName}</Text>}
							</View>

							<View className="mb-2">
								<Text
									style={[
										sharedStyles.label,
										{
											color: '#9B9797',
										},
									]}
								>
									Last Name
								</Text>
								<TextInput placeholder="Enter last name..." placeholderTextColor="#999" value={formData.lastName} onChangeText={(value) => updateFormData('lastName', value)} style={[sharedStyles.input, { borderColor: errors.firstName ? '#ef4444' : undefined }]} />
							</View>

							<View className="mb-2">
								<Text
									style={[
										sharedStyles.label,
										{
											color: '#9B9797',
										},
									]}
								>
									Email Address
								</Text>
								<TextInput
									placeholder="Enter user email address"
									placeholderTextColor="#999"
									value={formData.email}
									onChangeText={(value) => updateFormData('email', value)}
									keyboardType="email-address"
									autoCapitalize="none"
									style={[sharedStyles.input, { borderColor: errors.email ? '#ef4444' : undefined }]}
								/>
								{errors.email && <Text className="text-red-600 text-xs font-ubuntu-regular mt-1">{errors.email}</Text>}
							</View>

							<View className="mb-2">
								<Text
									style={[
										sharedStyles.label,
										{
											color: '#9B9797',
										},
									]}
								>
									Phone Number
								</Text>
								<TextInput
									placeholder="Enter user phone number"
									placeholderTextColor="#999"
									value={formData.phoneNumber}
									onChangeText={(value) => updateFormData('phoneNumber', value)}
									keyboardType="phone-pad"
									style={[sharedStyles.input, { borderColor: errors.phoneNumber ? '#ef4444' : undefined }]}
								/>
								{errors.phoneNumber && <Text className="text-red-600 text-xs font-ubuntu-regular mt-1">{errors.phoneNumber}</Text>}
							</View>

							<View className="mb-2">
								<Text
									style={[
										sharedStyles.label,
										{
											color: '#9B9797',
										},
									]}
								>
									Create password
								</Text>
								<View className="relative">
									<TextInput
										placeholder="Enter password for user"
										placeholderTextColor="#999"
										value={formData.password}
										onChangeText={(value) => updateFormData('password', value)}
										secureTextEntry={!showPassword}
										style={[sharedStyles.input, { borderColor: errors.password ? '#ef4444' : undefined, paddingRight: 48 }]}
									/>
									<Pressable onPress={() => setShowPassword(!showPassword)} className="absolute right-3 top-6" disabled={loading}>
										<Image source={showPassword ? icons.eye : icons.hiddenEye} style={{ width: 20, height: 20 }} resizeMode="contain" />
									</Pressable>
								</View>
								{errors.password && <Text className="text-red-600 text-xs font-ubuntu-regular mt-1">{errors.password}</Text>}
							</View>

							<View className="mb-8">
								<Text
									style={[
										sharedStyles.label,
										{
											color: '#9B9797',
										},
									]}
								>
									Save User As
								</Text>
								{Platform.OS === 'ios' ? (
									<>
										<Pressable style={sharedStyles.input} onPress={() => setIsUserTypePickerVisible(true)}>
											<Text style={{ color: formData.userType ? '#000' : '#9CA3AF' }}>{formData.userType === 'resident' ? 'Resident' : formData.userType === 'security' ? 'Security Personnel' : 'Select user type'}</Text>
										</Pressable>
										<Modal transparent={true} visible={isUserTypePickerVisible} animationType="slide" onRequestClose={() => setIsUserTypePickerVisible(false)}>
											<Pressable style={styles.modalOverlay} onPress={() => setIsUserTypePickerVisible(false)}>
												<View className="bg-gray-800">
													<Picker
														selectedValue={formData.userType}
														onValueChange={(itemValue) => {
															updateFormData('userType', itemValue as 'resident' | 'admin');
															setIsUserTypePickerVisible(false);
														}}
														className="text-gray-300 h-14 w-full"
													>
														<Picker.Item label="Resident" value="resident" />
														<Picker.Item label="Security Personnel" value="security" />
													</Picker>
												</View>
											</Pressable>
										</Modal>
									</>
								) : (
									<View style={sharedStyles.input}>
										<Picker selectedValue={formData.userType} onValueChange={(value) => updateFormData('userType', value as 'resident' | 'admin')} className="text-gray-300 h-14 w-full text-sm" style={{ color: 'gray' }}>
											<Picker.Item label="Resident" value="resident" />
											<Picker.Item label="Security Personnel" value="security" />
										</Picker>
									</View>
								)}
							</View>

							<TouchableOpacity disabled={loading} onPress={handleContinue} className={`px-24 bg-primary justify-center items-center py-5 font-UbuntuSans !rounded-xl ${loading ? 'opacity-70' : ''}`} activeOpacity={0.8}>
								<Text className="text-white font-semibold font-UbuntuSans text-md">Continue</Text>
							</TouchableOpacity>
						</>
					) : (
						<>
							<View className="mb-2">
								<Text
									style={[
										sharedStyles.label,
										{
											color: '#9B9797',
										},
									]}
								>
									House Address
								</Text>
								<TextInput
									placeholder="Enter house address..."
									placeholderTextColor="#999"
									value={formData.homeAddress}
									onChangeText={(value) => updateFormData('homeAddress', value)}
									multiline
									numberOfLines={3}
									style={[sharedStyles.input, { borderColor: errors.homeAddress ? '#ef4444' : undefined }]}
								/>
								{errors.homeAddress && <Text className="text-red-600 text-xs font-ubuntu-regular mt-1">{errors.homeAddress}</Text>}
							</View>

							<View className="mb-8">
								<Text
									style={[
										sharedStyles.label,
										{
											color: '#9B9797',
										},
									]}
								>
									Means of Identification
								</Text>
								{Platform.OS === 'ios' ? (
									<>
										<Pressable style={sharedStyles.input} onPress={() => setIsMeansOfIdPickerVisible(true)}>
											<Text style={{ color: formData.meansOfIdentification ? '#000' : '#9CA3AF' }}>{MEANS_OF_IDENTIFICATION.find((item) => item.value === formData.meansOfIdentification)?.label || 'Select means of identification'}</Text>
										</Pressable>
										<Modal transparent={true} visible={isMeansOfIdPickerVisible} animationType="slide" onRequestClose={() => setIsMeansOfIdPickerVisible(false)}>
											<Pressable style={styles.modalOverlay} onPress={() => setIsMeansOfIdPickerVisible(false)}>
												<View className="bg-gray-800">
													<Picker
														selectedValue={formData.meansOfIdentification}
														onValueChange={(itemValue) => {
															updateFormData('meansOfIdentification', itemValue as MeansOfIdType);
															setIsMeansOfIdPickerVisible(false);
														}}
														className="text-gray-300 h-14 w-full"
													>
														{MEANS_OF_IDENTIFICATION.map((item) => (
															<Picker.Item key={item.value} label={item.label} value={item.value} />
														))}
													</Picker>
												</View>
											</Pressable>
										</Modal>
									</>
								) : (
									<View style={sharedStyles.input}>
										<Picker selectedValue={formData.meansOfIdentification} onValueChange={(value) => updateFormData('meansOfIdentification', value as MeansOfIdType)} className="text-gray-300 h-14 w-full text-sm" style={{ color: 'gray' }}>
											{MEANS_OF_IDENTIFICATION.map((item) => (
												<Picker.Item key={item.value} label={item.label} value={item.value} />
											))}
										</Picker>
									</View>
								)}
							</View>

							<TouchableOpacity disabled={loading} onPress={handleContinue} className={`px-24 bg-primary justify-center items-center py-5 font-UbuntuSans !rounded-xl ${loading ? 'opacity-70' : ''} gap-2 flex-row`} activeOpacity={0.8}>
								{loading && <ActivityIndicator color="#fff" size="small" />}
								<Text className="text-white font-ubuntu-semibold text-md">{loading ? 'Saving User...' : 'Save User'}</Text>
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

export default RegisterUser;
