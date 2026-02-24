import { useState, useCallback, memo } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { sharedStyles } from '@/src/theme/styles';
import Back from '@/src/components/mobile/Back';
import { updatepassword } from '@/src/lib/api/user';
import { useUserStore } from '@/src/lib/stores/userStore';
import { router } from 'expo-router';
import icons from '@/src/constants/icons';

interface PasswordInputProps {
	label: string;
	value: string;
	onChange: (text: string) => void;
	show: boolean;
	setShow: (show: boolean) => void;
	placeholder: string;
	disabled: boolean;
}

const PasswordInput = memo(({ label, value, onChange, show, setShow, placeholder, disabled }: PasswordInputProps) => {
	return (
		<>
			<Text className="text-[12px] text-primary mt-5">{label}</Text>
			<View className="relative mt-1">
				<TextInput
					className="bg-[#F7F9F9] rounded-lg px-5 py-3 h-16 text-base pr-12"
					placeholder={placeholder}
					value={value}
					onChangeText={onChange}
					secureTextEntry={!show}
					editable={!disabled}
					autoCapitalize="none"
					pointerEvents={disabled ? 'none' : 'auto'}
					// Disable copy and paste
					contextMenuHidden={true}
					selectTextOnFocus={false}
				/>
				<Pressable onPress={() => setShow(!show)} className="absolute right-3 top-5" disabled={disabled}>
					<Image source={show ? icons.eye : icons.hiddenEye} style={{ width: 20, height: 20 }} resizeMode="contain" />
				</Pressable>
			</View>
		</>
	);
});

PasswordInput.displayName = 'PasswordInput';

export default function EditRequest() {
	const [currentPassword, setCurrentPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [running, setRunning] = useState(false);

	const [showCurrent, setShowCurrent] = useState(false);
	const [showNew, setShowNew] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);

	const user_id = useUserStore((s) => s.user_id);

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
				[
					{
						text: 'OK',
						onPress: () => router.back(),
					},
				],
				{ cancelable: true },
			);
			return;
		} catch (err: any) {
			const message = err?.message || 'Failed to update password.';
			Alert.alert('Error', message);
		} finally {
			setRunning(false);
		}
	}, [currentPassword, newPassword, confirmPassword, user_id]);

	return (
		<SafeAreaView style={[sharedStyles.container, sharedStyles.modalContainer]}>
			<Back type="short-arrow" />

			<Text className="text-primary mt-10 text-3xl font-ubuntu-semibold mb-6">Change Password</Text>

			<PasswordInput label="Current Password" value={currentPassword} onChange={setCurrentPassword} show={showCurrent} setShow={setShowCurrent} placeholder="Enter your current password" disabled={running} />

			<PasswordInput label="New Password" value={newPassword} onChange={setNewPassword} show={showNew} setShow={setShowNew} placeholder="Enter your new password" disabled={running} />

			<PasswordInput label="Confirm Password" value={confirmPassword} onChange={setConfirmPassword} show={showConfirm} setShow={setShowConfirm} placeholder="Confirm your new password" disabled={running} />

			<View className="items-center mt-auto mb-12">
				<TouchableOpacity onPress={changePassword} disabled={running} className={`bg-primary rounded-xl py-5 px-20 justify-center items-center ${running ? 'opacity-90' : ''}`}>
					<Text className="text-white font-ubuntu-semibold text-lg">{running ? 'Saving Password...' : 'Save Password'}</Text>
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	);
}
