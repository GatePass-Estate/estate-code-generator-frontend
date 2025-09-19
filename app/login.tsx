import { useEffect, useState, useCallback } from 'react';
import { Platform, View, TextInput, Image, Text, ActivityIndicator, type ViewStyle, useWindowDimensions, KeyboardAvoidingView, StyleSheet, Pressable } from 'react-native';
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

WebBrowser.maybeCompleteAuthSession();
SplashScreen.preventAutoHideAsync();

const ROOT_STYLE: ViewStyle = {
	flex: 1,
	flexDirection: 'row',
	alignItems: 'center',
	justifyContent: 'center',
	backgroundColor: 'white',
	marginTop: -120,
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
				setErrorMessage('Your email is required.');
				return;
			}

			if (!password) {
				setErrorMessage('Your  password is required.');
				return;
			}

			const emailValue = email.trim().toLowerCase();
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(emailValue)) {
				setErrorMessage('Please enter a valid email address.');
				return;
			}

			if (password.length < 3) {
				setErrorMessage('Please enter a valid password.');
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
				setErrorMessage('Incorrect username or password');
			}
		} catch (error: any) {
			setErrorMessage(error.message || 'Login failed');
		} finally {
			setIsLoading(false);
		}
	};

	const isLargeScreen = width > 768;

	return (
		<KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
			<SafeAreaView style={ROOT_STYLE} onLayout={onLayoutRootView}>
				{isLargeScreen && (
					<View
						style={{
							width: '40%',
							height: '100%',
							justifyContent: 'center',
							alignItems: 'center',
							backgroundColor: 'white',
						}}
					>
						<Image source={require('@/assets/Frame 12.png')} resizeMode="contain" style={{ width: 300, height: 300 }} />
					</View>
				)}
				<View
					style={{
						width: isLargeScreen ? '60%' : '100%',
						maxWidth: 500,
						paddingHorizontal: 16,
						paddingVertical: 24,
						backgroundColor: 'white',
						alignSelf: 'center',
					}}
				>
					<View
						style={{
							justifyContent: 'center',
							alignItems: 'center',
							paddingTop: 40,
							paddingBottom: 24,
						}}
					>
						<Text
							style={{
								marginTop: 70,
								color: '#113E55',
								fontFamily: 'UbuntuSans',
								fontSize: 40,
								fontWeight: '400',
								textAlign: 'center',
							}}
						>
							Welcome !
						</Text>
						<Text
							style={{
								color: 'black',
								fontWeight: '500',
								fontSize: 10,
								textAlign: 'center',
								marginTop: 4,
							}}
						>
							Sign in to send invites to your guests
						</Text>
					</View>

					<View style={{ gap: 16 }}>
						{errorMessage && (
							<View style={{ backgroundColor: '#F8D7DA', padding: 20, borderRadius: 5, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
								<View style={{ flexDirection: 'row', alignItems: 'center' }}>
									<FontAwesome name="warning" size={15} color="red" />

									<Text
										style={{
											color: 'red',
											textAlign: 'left',
											flexWrap: 'wrap',
											marginLeft: 8,
										}}
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
							<Text style={{ color: '#113E55', paddingBottom: 4 }}>Email Address</Text>
							<TextInput placeholder="Enter your email address..." keyboardType="email-address" value={email} onChangeText={setEmail} autoCapitalize="none" editable={!isLoading} style={Styles.input} />
						</View>

						<View>
							<Text style={{ color: '#113E55', paddingBottom: 4 }}>Password</Text>
							<TextInput placeholder="Enter your password..." secureTextEntry value={password} onChangeText={setPassword} editable={!isLoading} style={Styles.input} />
						</View>

						<View style={{ gap: 20, marginTop: 16 }}>
							<Button
								size={Platform.select({ ios: 'lg', default: 'lg' })}
								style={{
									backgroundColor: '#113E55',
									height: 50,
									width: '90%',
									alignSelf: 'center',
									justifyContent: 'center',
									borderRadius: 8,
									flexDirection: 'row',
									alignItems: 'center',
									opacity: isLoading ? 0.7 : 1,
								}}
								onPress={handleSignInPress}
								disabled={isLoading}
							>
								{isLoading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: 'white', textAlign: 'center' }}>Sign In</Text>}
							</Button>
						</View>
					</View>
				</View>
			</SafeAreaView>
		</KeyboardAvoidingView>
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
