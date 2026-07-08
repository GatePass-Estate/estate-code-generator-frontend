import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Platform,
  View,
  TextInput,
  Image,
  Text,
  ActivityIndicator,
  useWindowDimensions,
  Pressable,
} from 'react-native';
import { FontAwesome, AntDesign, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/src/components/nativewindui/Button';
import { useAuth } from '@/src/hooks/useAuthContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { fetchMe, loginUser } from '@/src/lib/api/auth';
import { User } from '@/src/types/user';
import { useAuthStore } from '@/src/lib/stores/authStore';
import {
  broadcastLogin,
  getWidthBreakpoint,
  storeAuthState,
  getSelectedInstitution,
  clearSelectedInstitution,
  type SelectedInstitution,
} from '@/src/lib/helpers';
import Images from '@/src/constants/images';
import { cn } from '@/src/lib/cn';
import icons from '@/src/constants/icons';
import LoadingTransition from '@/src/components/common/LoadingTransition';
import {
  canUseBiometricLogin,
  deleteBiometricToken,
  getBiometricToken,
  promptBiometrics,
  isBiometricAvailable,
  hasBiometricPromptBeenDismissed,
  dismissBiometricPrompt,
  saveBiometricCredentials,
} from '@/src/lib/biometricAuth';
import { BiometricPromptModal } from '@/src/components/mobile/BiometricPromptModal';
import Back from '@/src/components/mobile/Back';

SplashScreen.preventAutoHideAsync();

export default function Login() {
  const { signIn } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const searchParams = useLocalSearchParams<{ tos_rejected?: string }>();

  const [appIsReady, setAppIsReady] = useState(false);
  const [estate, setEstate] = useState<SelectedInstitution | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTosRejected, setShowTosRejected] = useState(searchParams.tos_rejected === 'true');
  const [showBiometric, setShowBiometric] = useState(false);
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  const [pendingAuth, setPendingAuth] = useState<{ token: string; user: User } | null>(null);

  const isLargeScreen = width > getWidthBreakpoint();

  const routeForUser = useCallback(
    (user: User) => {
      if (user.role === 'resident' || ['primary_admin', 'admin'].includes(user.role!)) {
        router.replace('/user');
      } else if (user.role === 'security') {
        router.replace('/security');
      } else {
        setErrorMessage('Incorrect username or password.');
        setIsLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    const prepare = async () => {
      const institution = await getSelectedInstitution();
      if (!institution) {
        router.replace('/auth/institution');
        return;
      }
      setEstate(institution);
      const biometric = await canUseBiometricLogin();
      setShowBiometric(biometric);
      setAppIsReady(true);
    };
    prepare();
  }, [router]);

  useEffect(() => {
    if (errorMessage) setErrorMessage('');
    // Only clear when input values change; intentional exclusion.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, password]);

  useEffect(() => {
    if (Platform.OS === 'web') document.title = 'Login - GatePass';
  }, []);

  const handleBackPress = useCallback(async () => {
    await clearSelectedInstitution();
    router.replace('/auth/institution');
  }, [router]);

  const finishSignIn = useCallback(
    async (
      token: string,
      options?: { clearExistingBiometric?: boolean; skipRouting?: boolean }
    ): Promise<User> => {
      const user = await fetchMe(token);
      useAuthStore.setState({ access_token: token, role: user.role });
      await storeAuthState({ access_token: token, role: user.role });
      broadcastLogin(token, user.role);
      signIn(user);

      // If a different user/estate just signed in, remove any biometric token
      // that belonged to the previous account so the toggle and login screen
      // stay accurate for the active account.
      if (options?.clearExistingBiometric) {
        try {
          const { biometricTokenMatchesUser } = await import('@/src/lib/biometricAuth');
          const matches = await biometricTokenMatchesUser(user.user_id, user.estate_id);
          if (!matches) {
            await deleteBiometricToken();
          }
        } catch {
          // ignore cleanup errors
        }
      }

      if (!options?.skipRouting) {
        routeForUser(user);
      }

      return user;
    },
    [routeForUser, signIn]
  );

  const handleSignInPress = useCallback(async () => {
    setErrorMessage('');
    setIsLoading(true);

    if (!email || !password) {
      setErrorMessage('Email and password are required.');
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

    if (password.length < 3) {
      setErrorMessage('Please enter a valid password.');
      setIsLoading(false);
      return;
    }

    try {
      const result = await loginUser(emailValue, password, estate?.estate_id);

      if (result.requires_tos_acceptance && result.access_token) {
        router.push({
          pathname: '/auth/tos',
          params: { token: result.access_token, role: result.role || '' },
        });
        setIsLoading(false);
        return;
      }

      const user = await finishSignIn(result.access_token, {
        clearExistingBiometric: true,
        skipRouting: true,
      });
      setIsLoading(false);

      const shouldPrompt =
        Platform.OS !== 'web' &&
        (await isBiometricAvailable()) &&
        !(await canUseBiometricLogin(user.user_id)) &&
        !(await hasBiometricPromptBeenDismissed(user.user_id));

      if (shouldPrompt) {
        setPendingAuth({ token: result.access_token, user });
        setShowBiometricPrompt(true);
      } else {
        routeForUser(user);
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Login failed');
      setIsLoading(false);
    }
  }, [email, password, estate, finishSignIn, routeForUser, router]);

  const handleBiometricLogin = useCallback(async () => {
    setErrorMessage('');
    setIsLoading(true);

    try {
      const authenticated = await promptBiometrics('Unlock GatePass');
      if (!authenticated) {
        setIsLoading(false);
        return;
      }

      // On the login screen we do not yet know which user is signing in, so we
      // load whichever token the current device owner previously saved and let
      // the backend profile fetch verify identity.
      const token = await getBiometricToken();
      if (!token) {
        await deleteBiometricToken();
        setShowBiometric(false);
        setErrorMessage('Biometric login is not available. Please sign in with your password.');
        setIsLoading(false);
        return;
      }

      await finishSignIn(token);
    } catch (error: any) {
      await deleteBiometricToken();
      setShowBiometric(false);
      setErrorMessage(
        error.message || 'Biometric login failed. Please sign in with your password.'
      );
      setIsLoading(false);
    }
  }, [finishSignIn]);

  const handleEnableBiometricPrompt = useCallback(async () => {
    if (!pendingAuth) return;
    const { token, user } = pendingAuth;

    try {
      const success = await promptBiometrics('Enable biometric login');
      if (success) {
        await saveBiometricCredentials(token, user.user_id, user.estate_id);
      }
    } catch {
      // ignore biometric enable errors
    }

    setShowBiometricPrompt(false);
    setPendingAuth(null);
    routeForUser(user);
  }, [pendingAuth, routeForUser]);

  const handleDismissBiometricPrompt = useCallback(async () => {
    if (!pendingAuth) return;
    const { user } = pendingAuth;

    try {
      await dismissBiometricPrompt(user.user_id);
    } catch {
      // ignore storage errors
    }

    setShowBiometricPrompt(false);
    setPendingAuth(null);
    routeForUser(user);
  }, [pendingAuth, routeForUser]);

  const ErrorBanner = useMemo(
    () =>
      errorMessage ? (
        <View className="bg-red-50 p-5 rounded-lg flex-row justify-between items-center mb-4">
          <View className="flex-row items-center flex-1">
            <FontAwesome name="warning" size={15} color="#DC2626" />
            <Text className="ml-2 text-danger flex-shrink">{errorMessage}</Text>
          </View>
          <Pressable onPress={() => setErrorMessage('')}>
            <AntDesign name="close" size={15} color="#DC2626" />
          </Pressable>
        </View>
      ) : null,
    [errorMessage]
  );

  if (!appIsReady) return <LoadingTransition />;

  return (
    <>
      <SafeAreaView
        className={`min-h-[100dvh] bg-body ${isLargeScreen ? 'grid grid-cols-12' : 'flex-1'}`}
      >
        {isLargeScreen && (
          <View className="col-span-6 relative min-h-[100dvh] overflow-hidden">
            <Image
              source={Images.loginImage}
              resizeMode="cover"
              className="absolute inset-0 w-full h-full"
            />
          </View>
        )}

        <View
          className={cn(`w-full px-5 pt-6 ${isLargeScreen ? 'col-span-6' : 'flex-1'}`)}
          style={{ flex: 1 }}
        >
          <Back type="short-arrow" onPress={handleBackPress} showText={false} showBorder={true} />

          {showTosRejected && !isLargeScreen && (
            <View
              style={{
                borderRadius: 16,
                borderWidth: 0.5,
                borderColor: '#FFCDD2',
                backgroundColor: '#FFF0F0',
                paddingVertical: 14,
                paddingHorizontal: 24,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                alignSelf: 'center',
                gap: 10,
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  color: '#E53935',
                  fontSize: 14,
                  fontStyle: 'italic',
                }}
                className="font-inter-semibold text-center"
              >
                {`Please Accept Terms and Conditions \nto use GatePass`}
              </Text>
            </View>
          )}

          <View
            className="flex-1"
            style={{ justifyContent: isLargeScreen ? 'center' : 'flex-start' }}
          >
            <View
              className={`max-w-xl w-full justify-center self-center flex-1 ${showTosRejected && !isLargeScreen ? 'my-20' : 'my-40'}`}
            >
              <View className={cn(`mb-10 max-w-xl items-center text-center`)}>
                <Text className={cn(`text-primary font-ubuntu-semibold text-2xl`)}>Sign In to</Text>
                <Text className={cn(`text-primary font-ubuntu-medium mt-1 text-4xl`)}>
                  {estate?.estate_name}
                </Text>
              </View>

              {ErrorBanner}

              <View className="gap-4">
                <View className="relative">
                  <Text className="text-sm text-[#9B9797] mb-2">Email Address</Text>
                  <TextInput
                    placeholder="Enter your email address"
                    placeholderTextColor="#9B9797"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    editable={!isLoading}
                    className="bg-light-grey rounded-xl px-4 h-14 font-Inter text-base text-black"
                  />
                </View>

                <View className="relative">
                  <Text className="text-sm text-[#9B9797] mb-2">Password</Text>
                  <TextInput
                    placeholder="Enter your password"
                    placeholderTextColor="#9B9797"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    autoCapitalize="none"
                    editable={!isLoading}
                    className="bg-light-grey rounded-xl px-4 h-14 pr-12 font-Inter text-base text-black"
                    contextMenuHidden={true}
                    selectTextOnFocus={false}
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-11 active:opacity-70"
                    disabled={isLoading}
                  >
                    <Image
                      source={showPassword ? icons.eye : icons.hiddenEye}
                      className="w-5 h-5"
                      resizeMode="contain"
                    />
                  </Pressable>
                </View>
              </View>

              <View className="mt-auto gap-4 mx-8">
                <View className="flex-row w-full items-center gap-3">
                  <Button
                    className="h-14 w-full flex-row items-center justify-center rounded-full"
                    size={Platform.select({ ios: 'lg', default: 'lg' })}
                    onPress={handleSignInPress}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text className="text-white font-ubuntu-semibold text-lg">Continue</Text>
                    )}
                  </Button>

                  {showBiometric && (
                    <Pressable
                      onPress={handleBiometricLogin}
                      disabled={isLoading}
                      className="self-center w-14 h-14 rounded-full bg-primary items-center justify-center active:opacity-80"
                    >
                      <Ionicons name="finger-print" size={28} color="#CEE5ED" />
                    </Pressable>
                  )}
                </View>

                <Pressable
                  className="self-center active:opacity-70 w-full bg-[#E5F6FF] rounded-full h-14 items-center justify-center"
                  onPress={() => router.push('/auth/forgot-password')}
                >
                  <Text
                    className="text-primary font-ubuntu-semibold text-lg"
                    style={{ letterSpacing: -0.24, lineHeight: 16 }}
                  >
                    Forgot Password?
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>

      {showTosRejected && isLargeScreen && (
        <View className="absolute top-10 left-0 right-0 items-center z-50">
          <View
            className="bg-white rounded-2xl p-5 border border-red-100 flex-row items-start gap-4 shadow-sm"
            style={{
              width: 500,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 4.65,
              elevation: 8,
            }}
          >
            <Image
              source={require('@/src/assets/condition.svg')}
              style={{ width: 48, height: 48 }}
              resizeMode="contain"
            />
            <View className="flex-1 mt-0.5">
              <Text className="font-ubuntu-bold text-lg text-black">Terms of Service</Text>
              <Text className="font-inter-regular text-sm text-[#4B5563] mt-2 leading-5">
                Access to GatePass requires your acceptance of our Terms and Conditions.{'\n\n'}
                Please review and accept them to continue.
              </Text>
            </View>
            <Pressable
              className="p-1.5 rounded-lg active:bg-gray-100 bg-[#F9FAFB]"
              onPress={() => setShowTosRejected(false)}
            >
              <AntDesign name="close" size={18} color="#9CA3AF" />
            </Pressable>
          </View>
        </View>
      )}

      <BiometricPromptModal
        visible={showBiometricPrompt}
        onEnable={handleEnableBiometricPrompt}
        onDismiss={handleDismissBiometricPrompt}
      />
    </>
  );
}
