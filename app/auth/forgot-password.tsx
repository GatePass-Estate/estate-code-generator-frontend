import { useEffect, useState, useCallback } from 'react';
import { Platform, View, TextInput, Image, Text, ActivityIndicator, useWindowDimensions, Pressable } from 'react-native';
import { FontAwesome, AntDesign } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/src/components/nativewindui/Button';
import { useRouter } from 'expo-router';
import { forgotPassword } from '@/src/lib/api/auth';
import { getWidthBreakpoint } from '@/src/lib/helpers';
import Images from '@/src/constants/images';
import { cn } from '@/src/lib/cn';
import icons from '@/src/constants/icons';

export default function ForgotPassword() {
	const router = useRouter();
	const { width } = useWindowDimensions();

	const [email, setEmail] = useState('');
	const [errorMessage, setErrorMessage] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);

	const isLargeScreen = width > getWidthBreakpoint();

	useEffect(() => {
		if (Platform.OS === 'web') document.title = 'Forgot Password - GatePass';
	}, []);

	useEffect(() => {
		if (errorMessage) setErrorMessage('');
	}, [email]);

	const handleResetPassword = useCallback(async () => {
		setErrorMessage('');
		setIsLoading(true);

		if (!email) {
			setErrorMessage('Email address is required.');
			setIsLoading(false);
			return;
		}

		const emailValue = email.trim().toLowerCase();
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(emailValue)) {
			setErrorMessage('Please enter a valid email address.');
			setIsLoading(false);
			return;
		}

		try {
			await forgotPassword(emailValue);
			setIsSuccess(true);
		} catch (error: any) {
			setErrorMessage(error.message || 'Failed to send reset email');
		} finally {
			setIsLoading(false);
		}
	}, [email]);

	const ErrorBanner = errorMessage ? (
		<View className="bg-red-50 p-5 rounded-lg flex-row justify-between items-center mb-4">
			<View className="flex-row items-center flex-1">
				<FontAwesome name="warning" size={15} color="#DC2626" />
				<Text className="ml-2 text-danger flex-shrink">{errorMessage}</Text>
			</View>
			<Pressable onPress={() => setErrorMessage('')}>
				<AntDesign name="close" size={15} color="#DC2626" />
			</Pressable>
		</View>
	) : null;

	if (isSuccess) {
		return (
			<SafeAreaView className={`h-full ${isLargeScreen ? 'grid grid-cols-12' : 'flex-1 bg-white'}`}>
				{isLargeScreen && (
					<View className="col-span-6 relative h-screen overflow-hidden">
						<Image source={Images.loginImage} resizeMode="cover" className="absolute inset-0 w-full h-full" />
					</View>
				)}

				<View
					className={cn(`p-6 w-full self-center ${isLargeScreen ? 'col-span-6' : ''}`)}
					style={{ flex: 1, justifyContent: 'center' }}
				>
					<View className="items-center mb-10 text-center max-w-xl">
						<View className="bg-green-100 rounded-full p-4 mb-4">
							<FontAwesome name="check-circle" size={40} color="#1B998B" />
						</View>
						<Text className={`text-primary font-UbuntuSans ${isLargeScreen ? 'text-4xl' : 'text-3xl'}`}>Check Your Email</Text>
						<Text className={`mt-3 text-grey font-Inter ${isLargeScreen ? 'text-base' : 'text-sm'} text-center px-4`}>
							We've sent a password reset link to{'\n'}
							<Text className="font-ubuntu-bold text-primary">{email}</Text>
						</Text>
						<Text className={`mt-2 text-grey font-Inter ${isLargeScreen ? 'text-sm' : 'text-xs'} text-center px-6`}>
							Please check your inbox and click the link to reset your password. If you don't see the email, check your spam folder.
						</Text>
					</View>

					<View className="gap-4 max-w-xl">
						<Button
							className={`self-center rounded-lg flex-row items-center justify-center w-11/12 h-14`}
							size={Platform.select({ ios: 'lg', default: 'lg' })}
							onPress={() => {
								setIsSuccess(false);
								setEmail('');
							}}
						>
							<Text className="text-white font-UbuntuSans font-semibold text-center">Send Again</Text>
						</Button>

						<Pressable className="self-center mt-2" onPress={() => router.replace('/auth/login')}>
							<Text className="text-teal font-ubuntu-medium text-base underline">Back to Login</Text>
						</Pressable>
					</View>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView className={`h-full ${isLargeScreen ? 'grid grid-cols-12' : 'flex-1 bg-white'}`}>
			{isLargeScreen && (
				<View className="col-span-6 relative h-screen overflow-hidden">
					<Image source={Images.loginImage} resizeMode="cover" className="absolute inset-0 w-full h-full" />
				</View>
			)}

			<View
				className={cn(`p-6 w-full self-center ${isLargeScreen ? 'col-span-6' : ''}`)}
				style={{ flex: 1, justifyContent: 'center' }}
			>
				<View className="items-center mb-10 text-center max-w-xl">
					<Text className={`text-primary font-UbuntuSans ${isLargeScreen ? 'text-5xl' : 'text-4xl'}`}>Forgot Password</Text>
					<Text className={`mt-2 text-grey font-Inter ${isLargeScreen ? 'text-base' : 'text-xs font-medium'} text-center`}>
						Enter your email address and we'll send you a link to reset your password
					</Text>
				</View>

				<View className="gap-4 max-w-xl">
					{ErrorBanner}

					<View>
						<Text className={`pb-1 text-grey ${isLargeScreen ? 'text-base' : ''}`}>Email Address</Text>
						<TextInput
							placeholder="Enter your email address..."
							keyboardType="email-address"
							value={email}
							onChangeText={setEmail}
							autoCapitalize="none"
							editable={!isLoading}
							className="bg-[#F7F9F9] border border-[#D1D5DB] rounded-lg px-4 py-5 mt-1"
						/>
					</View>

					<View className="mt-4 gap-5">
						<Button
							className={`self-center rounded-lg flex-row items-center justify-center w-11/12 h-14 ${isLoading ? 'opacity-70' : ''}`}
							size={Platform.select({ ios: 'lg', default: 'lg' })}
							onPress={handleResetPassword}
							disabled={isLoading}
						>
							{isLoading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-UbuntuSans font-semibold text-center">Reset Password</Text>}
						</Button>
					</View>

					<Pressable className="self-center mt-2" onPress={() => router.back()}>
						<Text className="text-teal font-ubuntu-medium text-base underline">Back to Login</Text>
					</Pressable>
				</View>
			</View>
		</SafeAreaView>
	);
}
