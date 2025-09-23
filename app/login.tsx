import { useEffect, useState, useCallback } from 'react';
import { Platform, View, TextInput, Image, Text, ActivityIndicator, type ViewStyle, useWindowDimensions, StyleSheet, Pressable } from 'react-native';
import { FontAwesome, AntDesign } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/nativewindui/Button';
import * as WebBrowser from 'expo-web-browser';
import * as SplashScreen from 'expo-splash-screen';
import { useAuth } from '@/hooks/useAuthContext';
import { useRouter } from 'expo-router';
import { fetchMe, loginUser } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/stores/authStore';
import { storeAuthState } from '@/lib/helpers';
import Images from '@/constants/images';
import { cn } from '@/lib/cn';

WebBrowser.maybeCompleteAuthSession();
SplashScreen.preventAutoHideAsync();

const ROOT_STYLE: ViewStyle = {
	flex: 1,
	flexDirection: 'row',
	alignItems: 'center',
	justifyContent: 'center',
	backgroundColor: 'white',
};

export default function Login() {
	const { signIn } = useAuth();
	const router = useRouter();
	const { width } = useWindowDimensions();

	const [appIsReady, setAppIsReady] = useState(false);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [errorMessage, setErrorMessage] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		const prepare = async () => {
			try {
				await new Promise((resolve) => setTimeout(resolve, 2000));
			} catch (e) {
				console.warn(e);
			} finally {
				setAppIsReady(true);
			}
		};
		prepare();
	}, []);

	useEffect(() => {
		if (errorMessage) setErrorMessage('');
	}, [email, password]);

	const onLayoutRootView = useCallback(async () => {
		if (appIsReady) {
			await SplashScreen.hideAsync();
		}
	}, [appIsReady]);

	if (!appIsReady) return null;

	const handleSignInPress = async () => {
		setIsLoading(true);
		try {
			if (!email) {
				setErrorMessage('Your email is required. ');
				return;
			}

			if (!password) {
				setErrorMessage('Your password is required. ');
				return;
			}

			const emailValue = email.trim().toLowerCase();
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(emailValue)) {
				setErrorMessage('Please enter a valid email address. ');
				return;
			}

			if (password.length < 3) {
				setErrorMessage('Please enter a valid password. ');
				return;
			}

			const result = await loginUser(emailValue, password);

			useAuthStore.setState({ access_token: result.access_token, role: result.role });
			await storeAuthState(result);

			const me = await fetchMe();

			const userPayload = {
				...me,
			};

			signIn(userPayload);

			setErrorMessage('');
			if (result.role === 'primary_admin' || result.role === 'root' || result.role === 'admin') {
				router.replace('/(admin)');
			} else if (result.role === 'resident') {
				router.replace('/(protected)/(tabs)/(home)');
			} else if (result.role === 'security') {
				router.replace('./(security)');
			} else {
				setErrorMessage('Incorrect username or password. Please try again. ');
			}
		} catch (error: any) {
			setErrorMessage(error.message || 'Login failed ');
		} finally {
			setIsLoading(false);
		}
	};

	const isLargeScreen = width > 768;

	return (
		<SafeAreaView style={ROOT_STYLE} onLayout={onLayoutRootView}>
			{isLargeScreen && (
				<View
					style={{
						backgroundColor: 'white',
					}}
					className="justify-center items-center h-full w-2/5"
				>
					<Image source={Images.loginImage} resizeMode="contain" className="w-80 h-80" />
				</View>
			)}
			<View className={cn(`py-6 px-4 ${isLargeScreen ? 'w-3/5' : 'w-full'} max-w-lg`)}>
				<View className="justify-center items-center mb-10 text-center font-normal">
					<Text
						className="text-5xl"
						style={{
							color: '#113E55',
							fontFamily: 'UbuntuSans',
						}}
					>
						Welcome !
					</Text>
					<Text
						className="text-xs font-medium text-center mt-1"
						style={{
							color: 'black',
						}}
					>
						Sign in to send invites to your guests
					</Text>
				</View>

				<View className="gap-4">
					{errorMessage && (
						<View style={{ backgroundColor: '#F8D7DA', padding: 20, borderRadius: 5, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
							<View style={{ flexDirection: 'row', alignItems: 'center' }}>
								<FontAwesome name="warning" size={15} color="red" />

								<Text
									style={{
										color: 'red',
									}}
									className="text-left flex-wrap ml-2"
								>
									{errorMessage}
								</Text>
							</View>

							<Pressable onPress={() => setErrorMessage('')}>
								<AntDesign name="close" size={15} color="red" />
							</Pressable>
						</View>
					)}

					<View>
						<Text className="pb-1" style={{ color: '#113E55' }}>
							Email Address
						</Text>
						<TextInput placeholder="Enter your email address..." keyboardType="email-address" value={email} onChangeText={setEmail} autoCapitalize="none" editable={!isLoading} style={Styles.input} />
					</View>

					<View>
						<Text className="pb-1" style={{ color: '#113E55' }}>
							Password
						</Text>
						<TextInput placeholder="Enter your password..." secureTextEntry value={password} onChangeText={setPassword} editable={!isLoading} style={Styles.input} />
					</View>

					<View className="mt-4 gap-5">
						<Button
							className={`self-center rounded-lg flex-row items-center justify-center ${isLoading ? 'opacity-70' : ''} w-11/12 h-12`}
							size={Platform.select({ ios: 'lg', default: 'lg' })}
							style={{
								backgroundColor: '#113E55',
							}}
							onPress={handleSignInPress}
							disabled={isLoading}
						>
							{isLoading ? (
								<ActivityIndicator color="#fff" />
							) : (
								<Text className="te" style={{ color: 'white', textAlign: 'center' }}>
									Sign In
								</Text>
							)}
						</Button>
					</View>
				</View>
			</View>
		</SafeAreaView>
	);
}

const Styles = StyleSheet.create({
	input: {
		backgroundColor: '#F7F9F9',
		borderColor: '#D1D5DB',
		borderRadius: 8,
		paddingHorizontal: 16,
		paddingVertical: 20,
		marginTop: 5,
	},
});
