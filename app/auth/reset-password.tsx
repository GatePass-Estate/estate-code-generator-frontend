import { useEffect, useState, useCallback } from 'react';
import { Platform, View, TextInput, Image, Text, ActivityIndicator, useWindowDimensions, Pressable } from 'react-native';
import { FontAwesome, AntDesign } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/src/components/nativewindui/Button';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { verifyPasswordReset, resetPassword } from '@/src/lib/api/auth';
import { getWidthBreakpoint } from '@/src/lib/helpers';
import Images from '@/src/constants/images';
import { cn } from '@/src/lib/cn';
import icons from '@/src/constants/icons';

export default function ResetPassword() {
	const router = useRouter();
	const { width } = useWindowDimensions();
	const params = useLocalSearchParams<{ token?: string; user_id?: string }>();

	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [isVerifying, setIsVerifying] = useState(true);
	const [isSuccess, setIsSuccess] = useState(false);
	const [userId, setUserId] = useState('');
	const [userEmail, setUserEmail] = useState('');
	const [tokenError, setTokenError] = useState('');

	const isLargeScreen = width > getWidthBreakpoint();

	useEffect(() => {
		if (Platform.OS === 'web') document.title = 'Reset Password - GatePass';
	}, []);

	useEffect(() => {
		const verify = async () => {
			if (params.user_id) {
				setUserId(params.user_id);
				setIsVerifying(false);
				return;
			}

			const token = params.token || (Platform.OS === 'web' ? new URLSearchParams(window.location.search).get('token') : null);

			if (!token) {
				setTokenError('Invalid password reset link. Please request a new one.');
				setIsVerifying(false);
				return;
			}

			try {
				const result = await verifyPasswordReset(token);
				setUserId(result.user_id);
				setUserEmail(result.email);
				setIsVerifying(false);
			} catch (error: any) {
				setTokenError(error.message || 'This reset link has expired or is invalid.');
				setIsVerifying(false);
			}
		};

		verify();
	}, [params.token, params.user_id]);

	useEffect(() => {
		if (errorMessage) setErrorMessage('');
	}, [newPassword, confirmPassword]);

	const handleResetPassword = useCallback(async () => {
		setErrorMessage('');
		setIsLoading(true);

		if (!newPassword || !confirmPassword) {
			setErrorMessage('Both password fields are required.');
			setIsLoading(false);
			return;
		}

		if (newPassword.length < 8) {
			setErrorMessage('Password must be at least 8 characters long.');
			setIsLoading(false);
			return;
		}

		if (newPassword !== confirmPassword) {
			setErrorMessage('Passwords do not match.');
			setIsLoading(false);
			return;
		}

		try {
			await resetPassword(userId, newPassword);
			setIsSuccess(true);
		} catch (error: any) {
			setErrorMessage(error.message || 'Failed to reset password');
		} finally {
			setIsLoading(false);
		}
	}, [newPassword, confirmPassword, userId]);

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

	// Loading state while verifying token
	if (isVerifying) {
		return (
			<SafeAreaView className="h-full flex-1 bg-white items-center justify-center">
				<ActivityIndicator size="large" color="#113E55" />
				<Text className="mt-4 text-grey font-Inter text-base">Verifying your reset link...</Text>
			</SafeAreaView>
		);
	}

	// Token expired or invalid
	if (tokenError) {
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
						<View className="bg-red-50 rounded-full p-4 mb-4">
							<FontAwesome name="times-circle" size={40} color="#DC2626" />
						</View>
						<Text className={`text-primary font-UbuntuSans ${isLargeScreen ? 'text-4xl' : 'text-3xl'}`}>Link Expired</Text>
						<Text className={`mt-3 text-grey font-Inter ${isLargeScreen ? 'text-base' : 'text-sm'} text-center px-4`}>
							{tokenError}
						</Text>
					</View>

					<View className="gap-4 max-w-xl">
						<Button
							className={`self-center rounded-lg flex-row items-center justify-center w-11/12 h-14`}
							size={Platform.select({ ios: 'lg', default: 'lg' })}
							onPress={() => router.replace('/auth/forgot-password')}
						>
							<Text className="text-white font-UbuntuSans font-semibold text-center">Request New Link</Text>
						</Button>

						<Pressable className="self-center mt-2" onPress={() => router.replace('/auth/login')}>
							<Text className="text-teal font-ubuntu-medium text-base underline">Back to Login</Text>
						</Pressable>
					</View>
				</View>
			</SafeAreaView>
		);
	}

	// Success state
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
						<Text className={`text-primary font-UbuntuSans ${isLargeScreen ? 'text-4xl' : 'text-3xl'}`}>Password Reset!</Text>
						<Text className={`mt-3 text-grey font-Inter ${isLargeScreen ? 'text-base' : 'text-sm'} text-center px-4`}>
							Your password has been successfully reset. You can now log in with your new password.
						</Text>
					</View>

					<View className="gap-4 max-w-xl">
						<Button
							className={`self-center rounded-lg flex-row items-center justify-center w-11/12 h-14`}
							size={Platform.select({ ios: 'lg', default: 'lg' })}
							onPress={() => router.replace('/auth/login')}
						>
							<Text className="text-white font-UbuntuSans font-semibold text-center">Back to Login</Text>
						</Button>
					</View>
				</View>
			</SafeAreaView>
		);
	}

	// Main reset password form
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
					<Text className={`text-primary font-UbuntuSans ${isLargeScreen ? 'text-5xl' : 'text-4xl'}`}>Reset Password</Text>
					<Text className={`mt-2 text-grey font-Inter ${isLargeScreen ? 'text-base' : 'text-xs font-medium'} text-center`}>
						{userEmail ? `Enter a new password for ${userEmail}` : 'Enter your new password below'}
					</Text>
				</View>

				<View className="gap-4 max-w-xl">
					{ErrorBanner}

					<View>
						<Text className={`pb-1 text-grey ${isLargeScreen ? 'text-base' : ''}`}>New Password</Text>
						<View className="relative">
							<TextInput
								placeholder="Enter your new password..."
								secureTextEntry={!showNewPassword}
								value={newPassword}
								onChangeText={setNewPassword}
								editable={!isLoading}
								className="bg-[#F7F9F9] border border-[#D1D5DB] rounded-lg px-4 py-5 mt-1 pr-12"
								contextMenuHidden={true}
								selectTextOnFocus={false}
							/>
							<Pressable onPress={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-6" disabled={isLoading}>
								<Image source={showNewPassword ? icons.eye : icons.hiddenEye} style={{ width: 20, height: 20 }} resizeMode="contain" />
							</Pressable>
						</View>
					</View>

					<View>
						<Text className={`pb-1 text-grey ${isLargeScreen ? 'text-base' : ''}`}>Confirm Password</Text>
						<View className="relative">
							<TextInput
								placeholder="Confirm your new password..."
								secureTextEntry={!showConfirmPassword}
								value={confirmPassword}
								onChangeText={setConfirmPassword}
								editable={!isLoading}
								className="bg-[#F7F9F9] border border-[#D1D5DB] rounded-lg px-4 py-5 mt-1 pr-12"
								contextMenuHidden={true}
								selectTextOnFocus={false}
							/>
							<Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-6" disabled={isLoading}>
								<Image source={showConfirmPassword ? icons.eye : icons.hiddenEye} style={{ width: 20, height: 20 }} resizeMode="contain" />
							</Pressable>
						</View>
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

					<Pressable className="self-center mt-2" onPress={() => router.replace('/auth/login')}>
						<Text className="text-teal font-ubuntu-medium text-base underline">Back to Login</Text>
					</Pressable>
				</View>
			</View>
		</SafeAreaView>
	);
}
