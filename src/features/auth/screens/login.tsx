import {
  setPendingTos,
  setPendingTwoFactorToken,
} from '@/src/features/auth/services/pendingSignIn';
import { errorMessage as thrownMessage } from '@/src/shared/services/api/errors';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  Platform,
  View,
  Image,
  Text,
  useWindowDimensions,
  Pressable,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard,
} from 'react-native';
import AppTextInput from '@/src/shared/components/form/AppTextInput';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome, AntDesign } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '@/src/shared/components/Button';
import { useAuth } from '@/src/features/auth/hooks/useAuthContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { fetchMe, loginBiometric, loginUser } from '@/src/features/auth';
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
  saveBiometricCredentials,
  invalidateLocalBiometricSession,
} from '@/src/features/auth/services/biometricAuth';
import { useBiometricSignInPrompt } from '@/src/features/auth/hooks/useBiometricSignInPrompt';
import PasswordTextInput from '@/src/features/auth/components/PasswordTextInput';
import Back from '@/src/shared/components/navigation/Back';
import { parseSignOutReason, signOutNotice } from '@/src/features/auth/services/signOutReason';
import LoginFingerprint from '@/src/assets/icons/login-fingerprint.svg';

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
  const { runPostSignIn, biometricPromptModal } = useBiometricSignInPrompt();

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
        // Keep loading until this screen unmounts — clearing it first flashes Continue.
        router.push('/auth/two-factor');
        return;
      }

      if (result.requires_tos_acceptance && result.access_token) {
        setPendingTos(result.access_token, result.role || '');
        router.push('/auth/tos');
        return;
      }

      const user = await finishSignIn(result.access_token, {
        skipRouting: true,
        sessionId: result.session_id,
        refreshToken: result.refresh_token,
      });
      await setLastLoginInstitution(estate ?? null);
      await AsyncStorage.setItem('gatepass-last-email', emailValue);
      await AsyncStorage.setItem('gatepass-last-user-id', user.user_id);

      // Silent re-bind when the preference is on, the enable prompt on first login, nothing
      // otherwise. Shared with the 2FA and Terms of Service sign-in paths.
      // Stay on the loader until routeForUser replaces this screen (or the prompt takes over).
      const prompted = await runPostSignIn(result.access_token, user, () => routeForUser(user));
      if (prompted) setIsLoading(false);
    } catch (error: unknown) {
      setErrorMessage(thrownMessage(error) || 'Login failed');
      setIsLoading(false);
    }
  }, [email, password, estate, finishSignIn, routeForUser, router, runPostSignIn]);

  const handleBiometricLogin = useCallback(async () => {
    setErrorMessage('');

    // The token is stored without OS-level authentication, so the app enforces the check:
    // confirm with Face ID / fingerprint first and stay on the login screen if that fails.
    if (!(await promptBiometrics('Sign in to GatePass'))) return;

    setIsLoading(true);

    try {
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
      const message =
        thrownMessage(error) || 'Biometric login failed. Please sign in with your password.';
      // Only drop the local binding when the server says the token is gone — keep it
      // after idle timeout so fingerprint stays available for another try.
      if (/invalid or expired biometric|no session found/i.test(message)) {
        await invalidateLocalBiometricSession().catch(() => {});
        setShowBiometric(false);
      }
      setPassword('');
      setErrorMessage(message);
      setIsLoading(false);
    }
  }, [estate, finishSignIn, routeForUser]);

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
                    <Text className="text-center font-ubuntu-semibold text-2xl text-primary">
                      Sign in to
                    </Text>
                    <Text className="mt-1 text-center font-ubuntu-medium text-4xl text-primary">
                      {estate?.estate_name}
                    </Text>
                  </View>

                  {ErrorBanner}

                  <View className="mt-12">
                    <Text className="mb-2 font-inter-medium text-sm text-[#878686]">
                      Email address
                    </Text>
                    <AppTextInput
                      placeholder="Enter your email address"
                      keyboardType="email-address"
                      value={email}
                      onChangeText={(value) => setEmail(value)}
                      autoCapitalize="none"
                      editable={!isLoading}
                      className="h-14 rounded-2xl bg-[#EFF1F1] px-4 text-base"
                      style={{ fontSize: 16, lineHeight: 20 }}
                    />

                    <Text className="mb-2 mt-[10px] font-inter-medium text-sm text-[#878686]">
                      Password
                    </Text>
                    <View className="relative mt-2">
                      <PasswordTextInput
                        placeholder="Enter your password"
                        placeholderTextColor="#878686"
                        visible={showPassword}
                        value={password}
                        onChangeText={setPassword}
                        editable={!isLoading}
                        className="h-14 rounded-2xl bg-[#EFF1F1] px-4 pr-12 font-inter-light text-base text-primary"
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
                        className="absolute bottom-0 right-4 top-0 z-10 items-center justify-center active:opacity-70"
                        disabled={isLoading}
                        accessibilityRole="button"
                        accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                      >
                        <Image
                          source={showPassword ? icons.eye : icons.hiddenEye}
                          style={{ width: 20, height: 20 }}
                          resizeMode="contain"
                        />
                      </Pressable>
                    </View>
                  </View>
                </View>

                <View className="mt-6 items-center gap-[13px] self-center pb-8">
                  {/* Figma login: Continue 218 + gap 16 + fingerprint 44 = 278 (matches Forgot). */}
                  <View className={showBiometric ? 'flex-row items-center gap-4' : undefined}>
                    <Button
                      label="Continue"
                      labelSize="md"
                      onPress={handleSignInPress}
                      loading={isLoading}
                      style={
                        showBiometric
                          ? { width: 218, maxWidth: 218, height: 44, paddingVertical: 0 }
                          : undefined
                      }
                      className={showBiometric ? 'h-11 w-[218px] max-w-[218px] py-0' : undefined}
                    />
                    {showBiometric && (
                      <Pressable
                        onPress={handleBiometricLogin}
                        disabled={isLoading}
                        accessibilityRole="button"
                        accessibilityLabel="Sign in with fingerprint"
                        className={`h-11 w-11 items-center justify-center overflow-hidden rounded-full ${
                          isLoading ? 'opacity-80' : ''
                        }`}
                      >
                        <LoginFingerprint width={44} height={44} />
                      </Pressable>
                    )}
                  </View>
                  <Button
                    label="Forgot Password"
                    labelSize="md"
                    variant="secondary"
                    disabled={isLoading}
                    onPress={() => router.push('/auth/forgot-password')}
                  />
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </SafeAreaView>

      {biometricPromptModal}

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
