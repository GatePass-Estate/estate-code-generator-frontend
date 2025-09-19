import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { useColorScheme, useInitialAndroidBarSync } from '@/hooks/useColorScheme';
import { NAV_THEME } from '@/theme';
import { AuthProvider } from '@/hooks/useAuthContext';
import { ThemeProvider } from '@react-navigation/native';
import 'react-native-reanimated';

// Keep splash screen visible while loading fonts
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
	useInitialAndroidBarSync();
	const { colorScheme, isDarkColorScheme } = useColorScheme();

	const [loaded] = useFonts({
		RobotoItalic: require('../assets/fonts/Roboto-Italic-VariableFont_wdth,wght.ttf'),
		UbuntuSans: require('../assets/fonts/UbuntuSans-VariableFont_wdth,wght.ttf'),
	});

	if (!loaded) {
		return null;
	}

	return (
		<>
			<StatusBar key={`root-status-bar-${isDarkColorScheme ? 'light' : 'dark'}`} style={isDarkColorScheme ? 'light' : 'dark'} />
			<AuthProvider>
				<ThemeProvider value={NAV_THEME[colorScheme]}>
					<Stack
						initialRouteName="login"
						screenOptions={{
							headerShown: false,
						}}
					>
						<Stack.Screen name="login" options={{ animation: 'none' }} />
						<Stack.Screen name="(admin)" />
						<Stack.Screen name="(protected)" />
						<Stack.Screen name="(security)" />
					</Stack>
				</ThemeProvider>
			</AuthProvider>
		</>
	);
}
