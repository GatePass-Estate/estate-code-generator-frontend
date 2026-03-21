import { Platform } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { useInitialAndroidBarSync } from '@/src/hooks/useColorScheme';
import { AuthProvider, useAuth } from '@/src/hooks/useAuthContext';
import 'react-native-reanimated';
import { Inter, UbuntuSans } from '@/src/constants/fonts';
import './global.css';

SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
	const { resetKey } = useAuth();

	return (
		<>
			<StatusBar key={`root-status-bar-light`} style={'dark'} />
			<Stack
				key={resetKey}
				initialRouteName="auth/login"
				screenOptions={{
					headerShown: false,
				}}
			>
				<Stack.Screen name="auth/login" options={{ animation: 'none' }} />
				<Stack.Screen name="auth/tos" options={{ animation: 'none' }} />
				<Stack.Screen name="(protected)" />
			</Stack>
		</>
	);
}

export default function RootLayout() {
	if (Platform.OS === 'android') {
		useInitialAndroidBarSync();
	}

	const [loaded] = useFonts({
		RobotoItalic: require('../src/assets/fonts/Roboto-Italic-VariableFont_wdth,wght.ttf'),
		Roboto: require('../src/assets/fonts/Roboto-VariableFont_wdth,wght.ttf'),
		UbuntuSans: require('../src/assets/fonts/UbuntuSans-VariableFont_wdth,wght.ttf'),
		UbuntuSansItalic: require('../src/assets/fonts/UbuntuSans-Italic-VariableFont_wdth,wght.ttf'),

		[UbuntuSans.extraLight]: require('../src/assets/fonts/UbuntuSans-ExtraLight.ttf'),
		[UbuntuSans.light]: require('../src/assets/fonts/UbuntuSans-Light.ttf'),
		[UbuntuSans.regular]: require('../src/assets/fonts/UbuntuSans-Regular.ttf'),
		[UbuntuSans.medium]: require('../src/assets/fonts/UbuntuSans-Medium.ttf'),
		[UbuntuSans.semiBold]: require('../src/assets/fonts/UbuntuSans-SemiBold.ttf'),
		[UbuntuSans.bold]: require('../src/assets/fonts/UbuntuSans-Bold.ttf'),
		[UbuntuSans.extraBold]: require('../src/assets/fonts/UbuntuSans-ExtraBold.ttf'),

		[Inter.extraLight]: require('../src/assets/fonts/Inter_18pt-ExtraLight.ttf'),
		[Inter.light]: require('../src/assets/fonts/Inter_18pt-Light.ttf'),
		[Inter.regular]: require('../src/assets/fonts/Inter_18pt-Regular.ttf'),
		[Inter.medium]: require('../src/assets/fonts/Inter_18pt-Medium.ttf'),
		[Inter.semiBold]: require('../src/assets/fonts/Inter_18pt-SemiBold.ttf'),
		[Inter.mediumItalic]: require('../src/assets/fonts/Inter_18pt-MediumItalic.ttf'),
	});

	if (!loaded) {
		return null;
	}

	return (
		<AuthProvider>
			<RootLayoutContent />
		</AuthProvider>
	);
}
