import CustomSafeAreaView from '@/src/components/CustomSafeAreaView';
import { activateUser } from '@/src/lib/api/user';
import { Inter } from '@/src/constants/fonts';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  Pressable,
  Image,
  Text,
  View,
} from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { getWidthBreakpoint, grantActivationStatusAccess } from '@/src/lib/helpers';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cn } from '@/src/lib/cn';
import icons from '@/src/constants/icons';

const MIN_PASSWORD_LENGTH = 8;

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
    <View className="">
      <Text
        className={cn('text-primary font-ubuntu-medium', isLargeScreen ? 'text-5xl' : 'text-4xl')}
      >
        Set Password
      </Text>
    </View>

    {errorMessage ? (
      <View className="bg-red-50 p-4 rounded-lg">
        <Text className="text-danger text-sm text-center">{errorMessage}</Text>
      </View>
    ) : null}

    <View>
      <Text className={cn(`pb-1 ${password ? 'text-primary' : 'text-grey'}`, 'text-base')}>
        New password
      </Text>
      <View className="relative">
        <TextInput
          placeholder="Enter your new password"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
          editable={!isSubmitting}
          className="bg-[#F7F9F9] rounded-2xl px-4 py-5 mt-1 pr-12 text-primary"
          contextMenuHidden
          placeholderTextColor="#9B9797"
          selectTextOnFocus={false}
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
      <Text className={cn(`pb-1 ${confirmPassword ? 'text-primary' : 'text-grey'}`, 'text-base')}>
        Confirm password
      </Text>
      <View className="relative">
        <TextInput
          placeholder="Confirm your password"
          secureTextEntry={!showPassword}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          editable={!isSubmitting}
          className="bg-[#F7F9F9] rounded-2xl px-4 py-5 mt-1 pr-12 text-primary"
          contextMenuHidden
          placeholderTextColor="#9B9797"
          selectTextOnFocus={false}
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

    <View className="mx-10">
      <TouchableOpacity
        onPress={handleSubmit}
        disabled={isSubmitting}
        className={cn(
          'h-14 bg-primary rounded-full justify-center items-center w-full',
          isSubmitting && 'opacity-70'
        )}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white font-ubuntu-semibold text-lg">Submit</Text>
        )}
      </TouchableOpacity>
    </View>
  </View>
);

const WebSetPasswordView = (props: SetPasswordFormProps) => (
  <View className="flex-1 w-full bg-white items-center justify-center px-5 py-10">
    <View
      className="w-full max-w-[600px] rounded-lg items-center px-8 py-10"
      style={{ backgroundColor: '#fbfeff' }}
    >
      <SetPasswordForm {...props} />
    </View>
  </View>
);

const SetPasswordPage = () => {
  const { user_id } = useLocalSearchParams<{
    user_id?: string;
    email?: string;
  }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isLargeScreen = width > getWidthBreakpoint();

  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (errorMessage) setErrorMessage('');
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

    if (!user_id) {
      setErrorMessage('Verification failed. Please try the link again.');
      return;
    }

    setIsSubmitting(true);

    try {
      await activateUser({
        user_id,
        new_password: password,
      });
      grantActivationStatusAccess();
      router.replace('/auth/email-activation-status');
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to set password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [password, confirmPassword, user_id, router]);

  if (!user_id) {
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
        <View className="flex-1 px-6 pb-10 justify-center max-w-xl w-full self-center mx-auto">
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
