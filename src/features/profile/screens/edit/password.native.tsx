import { useGoBack } from '@/src/shared/hooks/useGoBack';
import { errorMessage as thrownMessage } from '@/src/shared/services/api/errors';
import { useState, useCallback, memo } from 'react';
import { View, Text, TextInput, Alert, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { sharedStyles } from '@/src/shared/theme/styles';
import Button from '@/src/shared/components/Button';
import Back from '@/src/shared/components/navigation/Back';
import { updatepassword } from '@/src/features/users/services/user';
import { useUserStore } from '@/src/store/userStore';

import icons from '@/src/shared/constants/icons';

interface PasswordInputProps {
  label: string;
  value: string;
  onChange: (text: string) => void;
  show: boolean;
  setShow: (show: boolean) => void;
  placeholder: string;
  disabled: boolean;
}

const PasswordInput = memo(
  ({ label, value, onChange, show, setShow, placeholder, disabled }: PasswordInputProps) => (
    <>
      <Text className="text-[12px] text-primary mt-5">{label}</Text>
      <Text
        className="mt-5 font-inter-medium text-[#878686]"
        style={{ fontSize: 8.96, lineHeight: 11 }}
      >
        {label}
      </Text>
      <View className="relative mt-2 h-14">
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="#878686"
          value={value}
          onChangeText={onChange}
          secureTextEntry={!show}
          editable={!disabled}
          autoCapitalize="none"
          pointerEvents={disabled ? 'none' : 'auto'}
          className="h-14 rounded-2xl bg-[#EFF1F1] px-4 pr-14 font-inter-light text-sm text-primary"
          style={{ paddingVertical: 0 }}
        />
        <Pressable
          onPress={() => setShow(!show)}
          hitSlop={8}
          className="absolute bottom-0 right-1 top-0 z-10 w-12 items-center justify-center active:opacity-70"
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={show ? 'Hide password' : 'Show password'}
        >
          <Image source={show ? icons.eye : icons.hiddenEye} className="h-5 w-5" />
        </Pressable>
      </View>
    </>
  )
);

PasswordInput.displayName = 'PasswordInput';

export default function ChangePasswordScreen() {
  const goBack = useGoBack();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [running, setRunning] = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const user_id = useUserStore((state) => state.user_id);

  const changePassword = useCallback(async () => {
    setRunning(true);

    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      setRunning(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'The new password and confirm password do not match');
      setRunning(false);
      return;
    }

    if (newPassword.length < 8 || currentPassword.length < 8) {
      Alert.alert('Error', 'The password must be at least 8 characters long');
      setRunning(false);
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert('Error', 'The new password cannot be the same as current password');
      setRunning(false);
      return;
    }

    try {
      await updatepassword({
        user_id,
        current_password: currentPassword,
        new_password: newPassword,
      });
      Alert.alert(
        'Success',
        'Password updated successfully',
        [{ text: 'OK', onPress: () => goBack() }],
        { cancelable: true }
      );
    } catch (error: unknown) {
      Alert.alert('Error', thrownMessage(error) || 'Failed to update password.');
    } finally {
      setRunning(false);
    }
  }, [confirmPassword, currentPassword, goBack, newPassword, user_id]);

  return (
    <SafeAreaView style={[sharedStyles.container, sharedStyles.modalContainer]}>
      <View className="flex-1 flex flex-col">
        <Back type="short-arrow" showText={false} showBorder />

        <Text className="text-primary mt-[18px] text-3xl font-ubuntu-semibold mb-6">
          Change Password
        </Text>

        <PasswordInput
          label="Current Password"
          value={currentPassword}
          onChange={setCurrentPassword}
          show={showCurrent}
          setShow={setShowCurrent}
          placeholder="Enter your current password"
          disabled={running}
        />

        <PasswordInput
          label="New Password"
          value={newPassword}
          onChange={setNewPassword}
          show={showNew}
          setShow={setShowNew}
          placeholder="Enter your new password"
          disabled={running}
        />

        <PasswordInput
          label="Confirm Password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          show={showConfirm}
          setShow={setShowConfirm}
          placeholder="Confirm your new password"
          disabled={running}
        />

        <View className="items-center mt-auto mb-12">
          <Button label="Save Password" loading={running} onPress={changePassword} />
        </View>
      </View>
    </SafeAreaView>
  );
}
