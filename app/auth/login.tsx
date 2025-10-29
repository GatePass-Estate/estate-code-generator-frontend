import * as WebBrowser from 'expo-web-browser';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, useCallback } from 'react';
import { Platform, View, TextInput, Image, Text, ActivityIndicator, useWindowDimensions, StyleSheet, Pressable } from 'react-native';
import { FontAwesome, AntDesign } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/src/components/nativewindui/Button';
import { useAuth } from '@/src/hooks/useAuthContext';
import { useRouter } from 'expo-router';
import { fetchMe, loginUser } from '@/src/lib/api/auth';
import { useAuthStore } from '@/src/lib/stores/authStore';
import { storeAuthState } from '@/src/lib/helpers';
import Images from '@/src/constants/images';
import { cn } from '@/src/lib/cn';

WebBrowser.maybeCompleteAuthSession();
SplashScreen.preventAutoHideAsync();

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
		setErrorMessage('');
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

			signIn(await fetchMe(result.access_token));

			if (result.role === 'primary_admin' || result.role === 'resident' || result.role === 'admin') {
				router.replace('/user');
			} else if (result.role === 'security') {
				router.replace('/security');
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
		<SafeAreaView className={`h-full ${isLargeScreen ? 'grid grid-cols-12' : 'flex-1 flex-row items-center justify-center bg-white'}`} onLayout={onLayoutRootView}>
			{isLargeScreen && (
				<View className="justify-center items-center overflow-hidden col-span-6 relative h-screen">
					<Image source={Images.loginImage} resizeMode="cover" className="absolute inset-0 w-full h-full" />
				</View>
			)}

			<View className={cn(`p-6 w-full self-center ${isLargeScreen ? 'col-span-6' : ''}`)}>
				<View className={`justify-center items-center mb-10 text-center font-normal max-w-xl`}>
					<Text className={`${isLargeScreen ? 'text-7xl' : 'text-5xl'} text-primary font-UbuntuSans`}>Welcome !</Text>
					<Text className={`${isLargeScreen ? 'text-base' : 'text-xs font-medium'} mt-1 text-black font-Inter`}>Sign in to send invites to your guests</Text>
				</View>

				<View className="gap-4 relative max-w-xl">
					{errorMessage && (
						<View style={{ backgroundColor: '#F8D7DA', padding: 20, borderRadius: 5, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
							<View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
								<FontAwesome name="warning" size={15} color="red" />

								<Text
									style={{
										flexShrink: 1,
									}}
									className="text-left ml-2 text-danger"
								>
									{errorMessage}
								</Text>
							</View>

							<Pressable onPress={() => setErrorMessage('')}>
								<AntDesign name="close" size={15} color="red" />
							</Pressable>
						</View>
					)}

					<View className="">
						<Text className={`${isLargeScreen && 'text-base'}pb-1 text-grey`}>Email Address</Text>
						<TextInput placeholder="Enter your email address..." keyboardType="email-address" value={email} onChangeText={setEmail} autoCapitalize="none" editable={!isLoading} style={Styles.input} />
					</View>

					<View>
						<Text className={`${isLargeScreen && 'text-base'}pb-1 text-grey`}>Password</Text>
						<TextInput placeholder="Enter your password..." secureTextEntry value={password} onChangeText={setPassword} editable={!isLoading} style={Styles.input} />
					</View>

					<View className="mt-4 gap-5">
						<Button className={`self-center rounded-lg flex-row items-center justify-center ${isLoading ? 'opacity-70' : ''} w-11/12 h-12 text-primary`} size={Platform.select({ ios: 'lg', default: 'lg' })} onPress={handleSignInPress} disabled={isLoading}>
							{isLoading ? <ActivityIndicator color="#fff" /> : <Text className="text-center text-white font-semibold font-UbuntuSans">Sign In</Text>}
						</Button>

						<Button className={`self-center rounded-lg flex-row items-center justify-center ${isLoading ? 'opacity-70' : ''} w-11/12 h-12 bg-dark-teal`} size={Platform.select({ ios: 'lg', default: 'lg' })} disabled={isLoading}>
							<Text className="text-center text-white font-semibold font-UbuntuSans">Continue With Google</Text>
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
