import { errorMessage as thrownMessage } from '@/src/shared/services/api/errors';
import CustomSafeAreaView from '@/src/features/auth/components/CustomSafeAreaView';
import { activateUser } from '@/src/features/users/services/user';
import { useCallback, useEffect, useState } from 'react';
import {
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  Pressable,
  Image,
  Text,
  View,
} from 'react-native';
import { CircleLoader } from '@/src/shared/components/feedback/ScreenLoading';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { grantActivationStatusAccess } from '@/src/features/auth/services/authPersistence';
import {
  clearPendingAuthToken,
  peekPendingAuthToken,
} from '@/src/features/auth/services/pendingAuthToken';
import { getWidthBreakpoint } from '@/src/shared/utils/helpers';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cn } from '@/src/shared/utils/cn';
import icons from '@/src/shared/constants/icons';
import PasswordTextInput from '@/src/features/auth/components/PasswordTextInput';

const MIN_PASSWORD_LENGTH = 8;

/** Match phase-2 set-password field sizing (AppTextInput zeros vertical padding by default). */
const FIELD_INPUT_STYLE = {
  fontSize: 16,
  lineHeight: 22,
  paddingVertical: 18,
} as const;

interface SetPasswordFormProps {
  password: string;
  setPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  isSubmitting: boolean;
  errorMessage: string;
  handleSubmit: () => void;
  isLargeScreen: boolean;
}

const SetPasswordForm = ({
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  showPassword,
  setShowPassword,
  isSubmitting,
  errorMessage,
  handleSubmit,
  isLargeScreen,
}: SetPasswordFormProps) => (
  <View className={cn('w-full max-w-xl', isLargeScreen ? 'gap-8' : 'gap-6')}>
    <View className={cn(!isLargeScreen && 'items-center')}>
      <Text
        className={cn(
          'text-primary font-ubuntu-medium',
          isLargeScreen ? 'text-5xl' : 'text-3xl text-center'
        )}
      >
        Set Password
      </Text>
      {!isLargeScreen ? (
        <Text className="mt-2 text-center font-Inter text-sm text-grey">
          Create a password to activate your account.
        </Text>
      ) : null}
    </View>

    {errorMessage ? (
      <View className="rounded-lg bg-red-50 p-4">
        <Text className="text-center text-sm text-danger">{errorMessage}</Text>
      </View>
    ) : null}

    <View>
      <Text
        className={cn(
          'pb-1',
          password ? 'text-primary' : 'text-grey',
          isLargeScreen ? 'text-base' : 'text-sm'
        )}
      >
        New password
      </Text>
      <View className="relative">
        <PasswordTextInput
          placeholder="Enter your new password"
          visible={showPassword}
          value={password}
          onChangeText={setPassword}
          editable={!isSubmitting}
          className="mt-1 rounded-2xl bg-[#F7F9F9] px-4 pr-12 text-primary"
          placeholderTextColor="#9B9797"
          style={FIELD_INPUT_STYLE}
        />
        <Pressable
          onPress={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-6"
          disabled={isSubmitting}
        >
          <Image
            source={showPassword ? icons.eye : icons.hiddenEye}
            style={{ width: 20, height: 20 }}
            resizeMode="contain"
          />
        </Pressable>
      </View>
    </View>

    <View>
      <Text
        className={cn(
          'pb-1',
          confirmPassword ? 'text-primary' : 'text-grey',
          isLargeScreen ? 'text-base' : 'text-sm'
        )}
      >
        Confirm password
      </Text>
      <View className="relative">
        <PasswordTextInput
          placeholder="Confirm your password"
          visible={showPassword}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          editable={!isSubmitting}
          className="mt-1 rounded-2xl bg-[#F7F9F9] px-4 pr-12 text-primary"
          placeholderTextColor="#9B9797"
          style={FIELD_INPUT_STYLE}
        />
        <Pressable
          onPress={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-6"
          disabled={isSubmitting}
        >
          <Image
            source={showPassword ? icons.eye : icons.hiddenEye}
            style={{ width: 20, height: 20 }}
            resizeMode="contain"
          />
        </Pressable>
      </View>
    </View>

    <View className={cn(isLargeScreen ? 'mx-10' : 'mx-0')}>
      <TouchableOpacity
        onPress={handleSubmit}
        disabled={isSubmitting}
        className={cn(
          'h-14 w-full items-center justify-center rounded-full bg-primary',
          isSubmitting && 'opacity-70'
        )}
      >
        {isSubmitting ? (
          <CircleLoader size={22} tone="light" />
        ) : (
          <Text className="font-ubuntu-semibold text-lg text-white">Submit</Text>
        )}
      </TouchableOpacity>
    </View>
  </View>
);

const WebSetPasswordView = (props: SetPasswordFormProps) => (
  <View className="w-full flex-1 items-center justify-center bg-white px-5 py-10">
    <View
      className="w-full max-w-[600px] items-center rounded-lg px-8 py-10"
      style={{ backgroundColor: '#fbfeff' }}
    >
      <SetPasswordForm {...props} />
    </View>
  </View>
);

const SetPasswordPage = () => {
  const params = useLocalSearchParams<{
    token?: string | string[];
    email?: string;
  }>();
  // Prefer the stash from /activate (memory + web sessionStorage) so the token is not
  // kept in route params. Peek — do not take — so Strict Mode remounts keep the token.
  const [token] = useState(() => {
    const stashed = peekPendingAuthToken();
    if (stashed.token) return stashed.token;
    const tokenFromParams = Array.isArray(params.token) ? params.token[0] : params.token;
    if (tokenFromParams) return tokenFromParams;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('token') ?? undefined;
    }
    return undefined;
  });
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isLargeScreen = width > getWidthBreakpoint();

  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setErrorMessage('');
  }, [password, confirmPassword]);

  const handleSubmit = useCallback(async () => {
    setErrorMessage('');

    if (!password || !confirmPassword) {
      setErrorMessage('Both password fields are required.');
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setErrorMessage(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (!token) {
      setErrorMessage('Verification failed. Please try the link again.');
      return;
    }

    setIsSubmitting(true);

    try {
      await activateUser({
        token,
        new_password: password,
      });
      clearPendingAuthToken();
      grantActivationStatusAccess();
      router.replace('/auth/email-activation-status');
    } catch (error: unknown) {
      setErrorMessage(thrownMessage(error) || 'Failed to set password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [password, confirmPassword, token, router]);

  if (!token) {
    grantActivationStatusAccess();
    return <Redirect href="/auth/email-activation-status?status=error" />;
  }

  const formProps: SetPasswordFormProps = {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    isSubmitting,
    errorMessage,
    handleSubmit,
    isLargeScreen,
  };

  if (Platform.OS === 'web' && isLargeScreen) {
    return <WebSetPasswordView {...formProps} />;
  }

  if (Platform.OS === 'web') {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="mx-auto w-full max-w-xl flex-1 justify-center self-center px-5 pb-10">
          <SetPasswordForm {...formProps} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <CustomSafeAreaView>
      <View className="px-5 flex-1 w-full flex flex-col justify-center">
        <SetPasswordForm {...formProps} />
      </View>
    </CustomSafeAreaView>
  );
};

export default SetPasswordPage;
