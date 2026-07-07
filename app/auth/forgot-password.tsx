import { useEffect, useState, useCallback } from 'react';
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
import { FontAwesome, AntDesign } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { forgotPassword } from '@/src/lib/api/auth';
import {
  getForgotPasswordCooldown,
  getForgotPasswordCooldownSeconds,
  getSelectedInstitution,
  getWidthBreakpoint,
  recordForgotPasswordAttempt,
} from '@/src/lib/helpers';
import Images from '@/src/constants/images';
import { cn } from '@/src/lib/cn';
import Back from '@/src/components/mobile/Back';

const formatCountdown = (seconds: number): string => {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export default function ForgotPassword() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [estateId, setEstateId] = useState<string | undefined>(undefined);

  const isLargeScreen = width > getWidthBreakpoint();
  const isCooldownActive = secondsRemaining > 0;

  useEffect(() => {
    if (Platform.OS === 'web') document.title = 'Forgot Password - GatePass';
  }, []);

  useEffect(() => {
    if (errorMessage) setErrorMessage('');
    // Only clear when the email value changes; intentional exclusion.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  useEffect(() => {
    const loadInitialState = async () => {
      const institution = await getSelectedInstitution();
      if (institution?.estate_id) {
        setEstateId(institution.estate_id);
      }

      const cooldown = await getForgotPasswordCooldown();
      if (cooldown?.email) {
        setEmail(cooldown.email);
        setIsSuccess(true);
        const remaining = await getForgotPasswordCooldownSeconds(cooldown.email);
        setSecondsRemaining(remaining);
      }
    };
    loadInitialState();
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    const tick = async () => {
      if (!email.trim()) {
        setSecondsRemaining(0);
        return;
      }

      const remaining = await getForgotPasswordCooldownSeconds(email);
      setSecondsRemaining(remaining);
    };

    tick();
    interval = setInterval(tick, 1000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [email]);

  const submit = useCallback(
    async (emailValue: string) => {
      await recordForgotPasswordAttempt(emailValue);
      await forgotPassword(emailValue, estateId);
    },
    [estateId]
  );

  const handleResetPassword = useCallback(async () => {
    setErrorMessage('');

    if (!email) {
      setErrorMessage('Email address is required.');
      return;
    }

    const emailValue = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (isCooldownActive) return;

    setIsLoading(true);

    try {
      await submit(emailValue);
      setIsSuccess(true);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  }, [email, isCooldownActive, submit]);

  const handleResend = useCallback(async () => {
    if (isCooldownActive) return;
    setErrorMessage('');

    const emailValue = email.trim().toLowerCase();
    if (!emailValue) {
      setErrorMessage('Email address is required.');
      return;
    }

    setIsLoading(true);

    try {
      await submit(emailValue);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to resend reset email');
    } finally {
      setIsLoading(false);
    }
  }, [email, isCooldownActive, submit]);

  const ErrorBanner = errorMessage ? (
    <View className="bg-red-50 p-5 rounded-lg flex-row justify-between items-center mb-4">
      <View className="flex-row items-center flex-1">
        <FontAwesome name="warning" size={15} color="#DC2626" />
        <Text className="ml-2 text-danger flex-shrink">{errorMessage}</Text>
      </View>
      <Pressable onPress={() => setErrorMessage('')}>
        <AntDesign name="close" size={15} color="#DC2626" />
      </Pressable>
    </View>
  ) : null;

  if (isSuccess) {
    return (
      <SafeAreaView className={`h-full ${isLargeScreen ? 'grid grid-cols-12' : 'flex-1 bg-body'}`}>
        {isLargeScreen && (
          <View className="col-span-6 relative h-screen overflow-hidden">
            <Image
              source={Images.loginImage}
              resizeMode="cover"
              className="absolute inset-0 w-full h-full"
            />
          </View>
        )}

        <View
          className={cn(`p-6 w-full self-center ${isLargeScreen ? 'col-span-6' : ''}`)}
          style={{ flex: 1, justifyContent: 'center' }}
        >
          <View className="items-center mb-10 text-center max-w-xl">
            <View className="bg-light-teal rounded-full p-4 mb-4">
              <FontAwesome name="check-circle" size={40} color="#1B998B" />
            </View>
            <Text className={`text-primary font-ubuntu-semibold text-4xl`}>Check your email</Text>
            <Text className={`mt-3 text-grey font-inter-regular text-center px-4`}>
              {"We've sent a password reset link to"}
              {'\n'}
              <Text className="font-ubuntu-bold text-primary">{email}</Text>
              {
                ". Please check your inbox and click the link to reset your password. If you don't see the email, check your spam folder."
              }
            </Text>

            <View className="mt-6 items-center gap-2 w-full">
              {isCooldownActive ? (
                <Text className="text-orange font-ubuntu-medium text-center">
                  Code resend in {formatCountdown(secondsRemaining)}
                </Text>
              ) : null}
              {/* <Pressable onPress={handleResend} disabled={isCooldownActive || isLoading}>
                <Text
                  className={`font-ubuntu-medium text-base underline ${
                    isCooldownActive || isLoading ? 'text-grey' : 'text-teal'
                  }`}
                >
                  Resend Verification Code
                </Text>
              </Pressable> */}
              {isLoading && (
                <View className="mt-2">
                  <ActivityIndicator color="#113E55" />
                </View>
              )}
            </View>
          </View>

          <View className="gap-4 max-w-xl w-full">
            <Pressable
              className="self-center flex-row items-center justify-center w-full h-14 bg-primary rounded-full"
              onPress={() => {
                setIsSuccess(false);
                setEmail('');
              }}
            >
              <Text
                className="text-white font-ubuntu-semibold text-center text-lg"
                style={{ letterSpacing: -0.24, lineHeight: 16 }}
              >
                Send Again
              </Text>
            </Pressable>

            <Pressable
              className="self-center active:opacity-70 w-full bg-[#E5F6FF] rounded-full h-14 items-center justify-center"
              onPress={() => router.replace('/auth/login')}
            >
              <Text
                className="text-primary font-ubuntu-semibold text-lg"
                style={{ letterSpacing: -0.24, lineHeight: 16 }}
              >
                Back to Login
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`h-full ${isLargeScreen ? 'grid grid-cols-12' : 'flex-1 bg-body'}`}>
      {isLargeScreen && (
        <View className="col-span-6 relative h-screen overflow-hidden">
          <Image
            source={Images.loginImage}
            resizeMode="cover"
            className="absolute inset-0 w-full h-full"
          />
        </View>
      )}

      <View className={cn(`p-6 w-full ${isLargeScreen ? 'col-span-6' : ''}`)} style={{ flex: 1 }}>
        <Back type="short-arrow" onPress={() => router.back()} showText={false} showBorder={true} />

        <View style={{ flex: 1, marginTop: 50 }}>
          <View className="mb-10 text-center max-w-xl">
            <Text
              className={`text-primary font-ubuntu-semibold ${isLargeScreen ? 'text-4xl' : 'text-3xl'}`}
            >
              Let&apos;s get you back in
            </Text>
            <Text className={`mt-2 text-[#0A1F29] font-ubuntu-regular`}>
              Enter the email associated with your account and we will send you password reset
              instructions
            </Text>
          </View>

          <View className="gap-4 max-w-xl w-full flex-1">
            {ErrorBanner}

            <View className="relative">
              <Text className="text-sm text-[#9B9797] mb-2">Email Address</Text>
              <TextInput
                placeholder="Enter user email address"
                placeholderTextColor="#9B9797"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                editable={!isLoading}
                className="bg-light-grey rounded-lg px-4 py-5 text-black font-Inter"
              />
            </View>

            {isCooldownActive ? (
              <Text className="text-orange font-ubuntu-medium">
                Code resend in {formatCountdown(secondsRemaining)}
              </Text>
            ) : null}
            <Pressable onPress={handleResend} disabled={isCooldownActive || isLoading}>
              <Text
                className={`font-ubuntu-medium text-base ${
                  isCooldownActive || isLoading ? 'text-grey' : 'text-primary'
                }`}
              >
                Resend Verification Code
              </Text>
            </Pressable>

            <View className="mt-auto gap-5 mb-11">
              <Pressable
                className={`self-center rounded-full flex-row items-center justify-center w-full h-14 active:opacity-80 ${
                  isCooldownActive || isLoading ? 'bg-grey' : 'bg-primary'
                }`}
                onPress={handleResetPassword}
                disabled={isCooldownActive || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-ubuntu-semibold text-center">Submit</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
