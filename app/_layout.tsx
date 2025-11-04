import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { useColorScheme, useInitialAndroidBarSync } from '@/src/hooks/useColorScheme';
import { AuthProvider } from '@/src/hooks/useAuthContext';
import 'react-native-reanimated';
import './global.css';
import { Platform } from 'react-native';

// Keep splash screen visible while loading fonts
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
	if (Platform.OS === 'android') {
		useInitialAndroidBarSync();
	}

	const { colorScheme, isDarkColorScheme } = useColorScheme();

	const [loaded] = useFonts({
		RobotoItalic: require('../src/assets/fonts/Roboto-Italic-VariableFont_wdth,wght.ttf'),
		Roboto: require('../src/assets/fonts/Roboto-VariableFont_wdth,wght.ttf'),
		UbuntuSans: require('../src/assets/fonts/UbuntuSans-VariableFont_wdth,wght.ttf'),
		UbuntuSansItalic: require('../src/assets/fonts/UbuntuSans-Italic-VariableFont_wdth,wght.ttf'),
	});

	if (!loaded) {
		return null;
	}

	return (
		<>
			<StatusBar key={`root-status-bar-${isDarkColorScheme ? 'light' : 'dark'}`} style={isDarkColorScheme ? 'light' : 'dark'} />
			<AuthProvider>
				{/* <ThemeProvider value={NAV_THEME[colorScheme]}> */}
				<Stack
					initialRouteName="auth/login"
					screenOptions={{
						headerShown: false,
					}}
				>
					<Stack.Screen name="auth/login" options={{ animation: 'none' }} />
					<Stack.Screen name="(protected)" />
				</Stack>
				{/* </ThemeProvider> */}
			</AuthProvider>
		</>
	);
}
