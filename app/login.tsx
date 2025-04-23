import React, { useEffect, useState } from 'react';
import {
  Platform,
  View,
  TextInput,
  Text,
  type ViewStyle,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/nativewindui/Button';
import { useColorScheme } from '@/lib/useColorScheme';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { useAuth } from '@/hooks/useAuthContext';
import { useRouter } from 'expo-router';

WebBrowser.maybeCompleteAuthSession();

const ROOT_STYLE: ViewStyle = { flex: 1, flexDirection: 'row' };

export default function Login() {
  const { colors } = useColorScheme();
  const { width } = useWindowDimensions();
  const { signIn } = useAuth();
  const router = useRouter();

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    iosClientId: 'your-ios-client-id.apps.googleusercontent.com',
    androidClientId: 'your-android-client-id.apps.googleusercontent.com',
    redirectUri: makeRedirectUri(),
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.accessToken) {
        fetchUserInfo(authentication.accessToken);
      }
    }
  }, [response]);

  async function fetchUserInfo(token: string) {
    const res = await fetch('https://www.googleapis.com/userinfo/v2/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const user = await res.json();
    signIn(user); // Use the auth context to sign in
  }

  const handleSignInPress = () => {
    // For email/password login, you would validate credentials first
    // Then call signIn() with the user data
    signIn({
      id: 'demo-user',
      name: 'Demo User',
      email: 'demo@example.com',
      role: 'admin',
      token: 'demo-token',
    });
  };

  const isLargeScreen = width > 768;

  return (
    <SafeAreaView style={ROOT_STYLE}>
      {isLargeScreen && (
        <View
          style={{
            width: '40%',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#113E55',
          }}>
          <Text style={{ fontSize: 48, fontWeight: 'bold', color: 'white' }}>
            Logo
          </Text>
        </View>
      )}
      <View
        style={{
          width: isLargeScreen ? '60%' : '100%',
          paddingHorizontal: 16,
          paddingVertical: 24,
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
            <Button
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
            </Button>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
