import {
  setPendingTos,
  setPendingTwoFactorToken,
} from '@/src/features/auth/services/pendingSignIn';
import { errorMessage as thrownMessage } from '@/src/shared/services/api/errors';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  Platform,
  View,
  TextInput,
  Image,
  Text,
  useWindowDimensions,
  Pressable,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome, AntDesign, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '@/src/shared/components/Button';
import { useAuth } from '@/src/features/auth/hooks/useAuthContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { enableBiometricLogin, fetchMe, loginBiometric, loginUser } from '@/src/features/auth';
import { User } from '@/src/features/users/types/user';
import { applySession } from '@/src/features/auth/services/authRefresh';
import {
  broadcastLogin,
  getLastLoginInstitution,
  getSelectedInstitution,
  setLastLoginInstitution,
  type SelectedInstitution,
} from '@/src/features/auth/services/authPersistence';
import { getWidthBreakpoint } from '@/src/shared/utils/helpers';
import Images from '@/src/shared/constants/images';
import { cn } from '@/src/shared/utils/cn';
import icons from '@/src/shared/constants/icons';
import {
  canUseBiometricLogin,
  getBiometricToken,
  promptBiometrics,
  isBiometricAvailable,
  hasBiometricPromptBeenDismissed,
  dismissBiometricPrompt,
  saveBiometricCredentials,
  isBiometricPreferenceEnabled,
  biometricTokenMatchesUser,
} from '@/src/features/auth/services/biometricAuth';
import { BiometricPromptModal } from '@/src/features/auth/components/BiometricPromptModal';
import PasswordTextInput from '@/src/features/auth/components/PasswordTextInput';
import Back from '@/src/shared/components/navigation/Back';
import { parseSignOutReason, signOutNotice } from '@/src/features/auth/services/signOutReason';
import { palette } from '@/src/shared/theme/palette';

export default function Login() {
  const { signIn } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const togglingPassword = useRef(false);
  const searchParams = useLocalSearchParams();

  const [estate, setEstate] = useState<SelectedInstitution | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTosRejected, setShowTosRejected] = useState(searchParams.tos_rejected === 'true');
  // Set when the app signed this device out on its own (inactivity, an expired sign-in, an ended
  // session); explains why the user is suddenly back on the login screen.
  const signedOutBecause = parseSignOutReason(searchParams.signed_out);
  const [sessionNoticeDismissed, setSessionNoticeDismissed] = useState(false);
  const [showBiometric, setShowBiometric] = useState(false);
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  const [pendingAuth, setPendingAuth] = useState<{ token: string; user: User } | null>(null);

  const isLargeScreen = width > getWidthBreakpoint();

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => {
      if (togglingPassword.current) return;
      scrollRef.current?.scrollToEnd({ animated: true });
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      if (togglingPassword.current) return;
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const routeForUser = useCallback(
    (user: User) => {
      if (user.role === 'resident' || ['root', 'primary_admin', 'admin'].includes(user.role!)) {
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
      if (
        Platform.OS === 'web' &&
        searchParams.fromInstitute !== 'true' &&
        !searchParams.signed_out &&
        searchParams.tos_rejected !== 'true'
      ) {
        router.replace('/auth/institution');
        return;
      }

      const draftInstitution = await getSelectedInstitution();
      const lastLoginInstitution = await getLastLoginInstitution();

      const institution = searchParams.fromInstitute
        ? await getSelectedInstitution()
        : (lastLoginInstitution ?? draftInstitution);

      if (!institution) {
        router.replace('/auth/institution');
        return;
      }

      setEstate(institution);
      const savedEmail = await AsyncStorage.getItem('gatepass-last-email');
      const savedUserId = await AsyncStorage.getItem('gatepass-last-user-id');
      if (savedEmail && savedEmail.trim()) {
        setEmail(savedEmail);
      }
      const biometric = await canUseBiometricLogin(savedUserId, institution?.estate_id);
      setShowBiometric(biometric);
    };
    void prepare().catch(() => {
      // STB-15: institution/biometric bootstrap must not surface as an unhandled rejection.
    });
  }, [router, searchParams.fromInstitute, searchParams.signed_out, searchParams.tos_rejected]);

  useEffect(() => {
    if (errorMessage) setErrorMessage('');
    // Only clear when input values change; intentional exclusion.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, password]);

  useEffect(() => {
    if (Platform.OS === 'web') document.title = 'Login - GatePass';
  }, []);

  const handleBackPress = useCallback(() => {
    // Prefer popping back to the existing institution screen (smooth slide) over remounting it.
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/auth/institution');
  }, [router]);

  const finishSignIn = useCallback(
    async (
      token: string,
      options?: {
        skipRouting?: boolean;
        sessionId?: string | null;
        refreshToken?: string | null;
      }
    ): Promise<User> => {
      const user = await fetchMe(token);
      await applySession({
        access_token: token,
        refresh_token: options?.refreshToken,
        role: user.role,
        session_id: options?.sessionId,
      });
      broadcastLogin(user.role);
      signIn(user);

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

    if (!estate?.estate_id) {
      setIsLoading(false);
      router.replace('/auth/institution');
      return;
    }

    try {
      const result = await loginUser(emailValue, password, estate.estate_id);

      // A 2FA challenge comes back without an access token, so it must be
      // handled before any code path that expects one.
      if (result.requires_2fa && result.two_fa_token) {
        await setLastLoginInstitution(estate ?? null);
        await AsyncStorage.setItem('gatepass-last-email', emailValue);
        setPendingTwoFactorToken(result.two_fa_token);
        router.push('/auth/two-factor');
        setIsLoading(false);
        return;
      }

      if (result.requires_tos_acceptance && result.access_token) {
        setPendingTos(result.access_token, result.role || '');
        router.push('/auth/tos');
        setIsLoading(false);
        return;
      }

      const user = await finishSignIn(result.access_token, {
        skipRouting: true,
        sessionId: result.session_id,
        refreshToken: result.refresh_token,
      });
      setIsLoading(false);
      await setLastLoginInstitution(estate ?? null);
      await AsyncStorage.setItem('gatepass-last-email', emailValue);
      await AsyncStorage.setItem('gatepass-last-user-id', user.user_id);

      const preferenceEnabled = await isBiometricPreferenceEnabled(user.user_id, user.estate_id);
      const tokenMatchesUser = await biometricTokenMatchesUser(user.user_id, user.estate_id);

      if (preferenceEnabled && !tokenMatchesUser) {
        try {
          const biometricResponse = await enableBiometricLogin(result.access_token, user.estate_id);
          await saveBiometricCredentials(
            biometricResponse.biometric_token,
            user.user_id,
            user.estate_id
          );
        } catch {
          // Keep the password flow working even if the silent refresh fails.
        }
      }

      // Do not call getBiometricToken here — that unlocks the keychain and prompts Face ID.
      const hasSavedBiometricForCurrentUser = await biometricTokenMatchesUser(
        user.user_id,
        user.estate_id
      );
      const hasPreferenceForCurrentUser = await isBiometricPreferenceEnabled(
        user.user_id,
        user.estate_id
      );
      const shouldPrompt =
        Platform.OS !== 'web' &&
        (await isBiometricAvailable()) &&
        !hasSavedBiometricForCurrentUser &&
        !hasPreferenceForCurrentUser &&
        !(await hasBiometricPromptBeenDismissed(user.user_id));

      if (shouldPrompt) {
        setPendingAuth({ token: result.access_token, user });
        setShowBiometricPrompt(true);
      } else {
        routeForUser(user);
      }
    } catch (error: unknown) {
      setErrorMessage(thrownMessage(error) || 'Login failed');
      setIsLoading(false);
    }
  }, [email, password, estate, finishSignIn, routeForUser, router]);

  const handleBiometricLogin = useCallback(async () => {
    setErrorMessage('');
    setIsLoading(true);

    try {
      // SecureStore.requireAuthentication prompts Face ID / fingerprint to unlock the token.
      const token = await getBiometricToken();
      if (!token || !estate?.estate_id) {
        setPassword('');
        setErrorMessage('Biometric login is not available. Please sign in with your password.');
        setIsLoading(false);
        return;
      }

      const response = await loginBiometric(token, estate.estate_id);
      if (response.requires_full_reauth) {
        setPassword('');
        setErrorMessage('Please sign in again to continue.');
        setIsLoading(false);
        return;
      }

      if (response.access_token) {
        const user = await finishSignIn(response.access_token, {
          skipRouting: true,
          sessionId: response.session_id,
          refreshToken: response.refresh_token,
        });
        if (response.biometric_token) {
          await saveBiometricCredentials(response.biometric_token, user.user_id, user.estate_id);
        }
        AsyncStorage.setItem('gatepass-last-email', user.email!);
        routeForUser(user);
      } else {
        throw new Error('Biometric login did not return an access token.');
      }
    } catch (error: unknown) {
      setPassword('');
      setErrorMessage(
        thrownMessage(error) || 'Biometric login failed. Please sign in with your password.'
      );
      setIsLoading(false);
    }
  }, [estate, finishSignIn, routeForUser]);

  const handleEnableBiometricPrompt = useCallback(async () => {
    if (!pendingAuth) return;
    const { token, user } = pendingAuth;

    try {
      const success = await promptBiometrics('Enable biometric login');
      if (success) {
        const biometricResponse = await enableBiometricLogin(token, user.estate_id);
        await saveBiometricCredentials(
          biometricResponse.biometric_token,
          user.user_id,
          user.estate_id
        );
      } else {
        await dismissBiometricPrompt(user.user_id);
      }
    } catch {
      await dismissBiometricPrompt(user.user_id);
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
          className={cn(`w-full px-5 ${isLargeScreen ? 'col-span-6' : 'flex-1'}`)}
          style={{ flex: 1 }}
        >
          <View style={{ marginTop: isLargeScreen ? 24 : Math.max(16, 102 - insets.top) }}>
            <Back type="short-arrow" onPress={handleBackPress} showText={false} showBorder={true} />
          </View>

          {signedOutBecause && !sessionNoticeDismissed && (
            <View
              className="absolute left-5 right-5 z-10 items-center"
              style={{ top: Math.max(16, 102 - insets.top) + 42 }}
              pointerEvents="box-none"
            >
              <View className="flex-row items-center gap-3 rounded-2xl border-mini border-[#FFCDD2] bg-[#FFF0F0] py-3 pl-5 pr-3">
                <Text className="flex-shrink text-center font-inter-regular text-xs text-[#B3261E]">
                  {signOutNotice(signedOutBecause)}
                </Text>
                <Pressable
                  onPress={() => setSessionNoticeDismissed(true)}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Dismiss message"
                  className="active:opacity-60"
                >
                  <AntDesign name="close" size={14} color="#B3261E" />
                </Pressable>
              </View>
            </View>
          )}

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

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={insets.top}
          >
            <ScrollView
              ref={scrollRef}
              keyboardShouldPersistTaps="always"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ flexGrow: 1 }}
            >
              <View className="flex-1 justify-center">
                <View className="w-full max-w-xl self-center">
                  <View className="items-center">
                    <Text
                      className="text-center font-ubuntu-semibold text-primary"
                      style={{ fontSize: 21.88, lineHeight: 26 }}
                    >
                      Sign in to
                    </Text>
                    <Text
                      className="text-center font-ubuntu-medium text-primary"
                      style={{ fontSize: 27.34, lineHeight: 33, marginTop: 5 }}
                    >
                      {estate?.estate_name}
                    </Text>
                  </View>

                  {ErrorBanner}

                  <View className="mt-12">
                    <Text
                      className="font-inter-medium text-[#878686]"
                      style={{ fontSize: 8.96, lineHeight: 11 }}
                    >
                      Email address
                    </Text>
                    <TextInput
                      placeholder="Enter your email address"
                      placeholderTextColor="#878686"
                      keyboardType="email-address"
                      value={email}
                      onChangeText={(value) => setEmail(value)}
                      autoCapitalize="none"
                      editable={!isLoading}
                      className="mt-2 h-14 rounded-2xl bg-[#EFF1F1] px-4 font-inter-light text-sm text-primary"
                      style={{ paddingVertical: 0 }}
                    />

                    <Text
                      className="mt-[10px] font-inter-medium text-[#878686]"
                      style={{ fontSize: 8.96, lineHeight: 11 }}
                    >
                      Password
                    </Text>
                    <View className="relative mt-2 h-14">
                      <PasswordTextInput
                        placeholder="Enter your password"
                        placeholderTextColor="#878686"
                        visible={showPassword}
                        value={password}
                        onChangeText={setPassword}
                        editable={!isLoading}
                        className="h-14 rounded-2xl bg-[#EFF1F1] px-4 pr-14 font-inter-light text-sm text-primary"
                        style={{ paddingVertical: 0 }}
                      />
                      <Pressable
                        onPress={() => {
                          togglingPassword.current = true;
                          setShowPassword((current) => !current);
                          setTimeout(() => {
                            togglingPassword.current = false;
                          }, 500);
                        }}
                        hitSlop={8}
                        className="absolute bottom-0 right-1 top-0 z-10 w-12 items-center justify-center active:opacity-70"
                        disabled={isLoading}
                        accessibilityRole="button"
                        accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                      >
                        <Image
                          source={showPassword ? icons.eye : icons.hiddenEye}
                          className="h-5 w-5"
                          resizeMode="contain"
                        />
                      </Pressable>
                    </View>
                  </View>
                </View>

                <View className="mt-6 items-center gap-[13px] self-center pb-8">
                  <Button label="Continue" onPress={handleSignInPress} loading={isLoading} />
                  <Button
                    label="Forgot Password"
                    variant="secondary"
                    disabled={isLoading}
                    onPress={() => router.push('/auth/forgot-password')}
                  />
                  {showBiometric && (
                    <Pressable
                      onPress={handleBiometricLogin}
                      disabled={isLoading}
                      className={`h-11 w-11 items-center justify-center self-center rounded-full ${isLoading && 'opacity-80'}`}
                      style={{ backgroundColor: palette.primary }}
                    >
                      {Platform.OS === 'ios' ? (
                        <MaterialCommunityIcons name="face-recognition" size={24} color="#CEE5ED" />
                      ) : (
                        <Ionicons name="finger-print" size={24} color="#CEE5ED" />
                      )}
                    </Pressable>
                  )}
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </SafeAreaView>

      <BiometricPromptModal
        visible={showBiometricPrompt}
        onEnable={handleEnableBiometricPrompt}
        onDismiss={handleDismissBiometricPrompt}
      />

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
    </>
  );
}
