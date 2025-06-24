import React, { useEffect, useState, useCallback } from 'react';
import {
  Platform,
  View,
  TextInput,
  Image,
  Text,
  type ViewStyle,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/nativewindui/Button';
import { useColorScheme } from '@/lib/useColorScheme';
import * as WebBrowser from 'expo-web-browser';
// import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { useAuth } from '@/hooks/useAuthContext';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

WebBrowser.maybeCompleteAuthSession();
SplashScreen.preventAutoHideAsync(); // Keep splash screen visible

const ROOT_STYLE: ViewStyle = { flex: 1, flexDirection: 'row' };

export default function Login() {
  const { colors } = useColorScheme();
  const { signIn } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [appIsReady, setAppIsReady] = useState(false);

  // const [request, response, promptAsync] = Google.useAuthRequest({
  //   clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
  //   iosClientId: '747446141313-4600vppfo3sefbvk9om458q3j802e7a4.apps.googleusercontent.com',
  //   androidClientId: '747446141313-pc9ucol0het3lt0thep83ejgtt31e197.apps.googleusercontent.com',
  //   redirectUri: makeRedirectUri({ useProxy: true }),
  // });

  // useEffect(() => {
  //   if (response?.type === 'success') {
  //     const { authentication } = response;
  //     if (authentication?.accessToken) {
  //       fetchUserInfo(authentication.accessToken);
  //     }
  //   }
  // }, [response]);

  async function fetchUserInfo(token: string) {
    const res = await fetch('https://www.googleapis.com/userinfo/v2/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const user = await res.json();
    signIn(user); // Use the auth context to sign in
  }

  useEffect(() => {
    const prepare = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    };
    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) return null;

  const handleSignInPress = () => {
    signIn({
      id: 'demo-user',
      name: 'Demo User',
      email: 'demo@example.com',
      role: 'security',
      token: 'demo-token',
    });
  };

  const isLargeScreen = width > 768;

  return (
    <SafeAreaView style={ROOT_STYLE} onLayout={onLayoutRootView}>
      {isLargeScreen && (
        <View
          style={{
            width: '40%',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'white',
          }}>
         <Image
  source={require('@/assets/Frame 12.png')}
  resizeMode="contain"
  style={{
    width: 1000,
    height: '120vh',
  }}
/>

        </View>
      )}
      <View
        style={{
          width: isLargeScreen ? '60%' : '100%',
          paddingHorizontal: 16,
          paddingVertical: 24,
          backgroundColor: 'white',
        }}>
        <View
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: 40,
            paddingBottom: 24,
          }}>
          <Text
            style={{
              marginTop: 70,
              color: '#113E55',
               fontFamily: 'UbuntuSans',
              fontSize: 40,
              fontWeight: '400',
              textAlign: 'center',
            }}>
            Welcome !
            
          </Text>
          <Text
            style={{
              color: 'black',
              fontWeight: '500',
              fontSize: 10,
              textAlign: 'center',
              marginTop: 4,
            }}>
            Sign in to send invites to your guests
          </Text>
        </View>
        <View style={{ gap: 16 }}>
          <View>
            <Text style={{ color: '#113E55', paddingBottom: 4 }}>
              Email Address
            </Text>
            <TextInput
              placeholder='Enter your email address...'
              keyboardType='email-address'
              style={{
                backgroundColor: '#F7F9F9',
                borderWidth: 1,
                borderColor: '#D1D5DB',
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
              }}
            />
          </View>
          <View>
            <Text style={{ color: '#113E55', paddingBottom: 4 }}>Password</Text>
            <TextInput
              placeholder='Enter your password...'
              secureTextEntry
              style={{
                backgroundColor: '#F7F9F9',
                borderWidth: 1,
                borderColor: '#D1D5DB',
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
              }}
            />
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
              }}
              onPress={handleSignInPress}>
              <Text style={{ color: 'white', textAlign: 'center' }}>
                Sign In
              </Text>
            </Button>
            {/* Continue with google button */}
            {/* <Button
              variant='primary'
              size={Platform.select({ ios: 'lg', default: 'lg' })}
              style={{
                backgroundColor: '#1B998B',
                height: 50,
                width: '90%',
                alignSelf: 'center',
                justifyContent: 'center',
                borderRadius: 8,
              }}
              onPress={() => promptAsync()}>
              <Text style={{ color: 'white', textAlign: 'center' }}>
                Continue with Google
              </Text>
            </Button> */}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
