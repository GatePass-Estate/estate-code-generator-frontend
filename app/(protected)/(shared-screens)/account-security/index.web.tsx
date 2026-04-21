import { useRouter } from 'expo-router';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Image, Platform, useWindowDimensions } from 'react-native';
import icons from '@/src/constants/icons';
import { useUserStore } from '@/src/lib/stores/userStore';
import { updatepassword } from '@/src/lib/api/user';
import { getWidthBreakpoint } from '@/src/lib/helpers';
import UpdatePassword from '@/src/components/web/UpdatePassword';
import Back from '@/src/components/mobile/Back';
import WebSidebar from '@/src/components/web/WebSidebar';
import { menuRoutes } from '../../user/_layout';

export default function AccountSecurityWeb() {
	const router = useRouter();
	const [showUpdatePassword, setShowUpdatePassword] = useState(false);
	const [savingPassword, setSavingPassword] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [password, setPassword] = useState({
		currentPassword: '',
		newPassword: '',
	});
	const confirmPasswordRef = useRef<HTMLInputElement | null>(null);
	const [showCurrent, setShowCurrent] = useState(false);
	const [showNew, setShowNew] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);

	const user_id = useUserStore((state) => state.user_id);
	const { width } = useWindowDimensions();

	const isLargeScreen = width > getWidthBreakpoint();

	const setNewPassword = useCallback(async () => {
		setSavingPassword(true);
		setError('');
		setSuccess('');

		const confirmValue = confirmPasswordRef.current?.value || '';

		if (password.newPassword !== confirmValue) {
			setError('The new password and the confirm password do not match');
			setSavingPassword(false);
			return;
		}

		if (password.newPassword.length < 8 || password.currentPassword.length < 8) {
			setError('The password must be at least 8 characters long');
			setSavingPassword(false);
			return;
		}

		if (password.newPassword === password.currentPassword) {
			setError('The new password cannot be the same as the current password');
			setSavingPassword(false);
			return;
		}

		try {
			await updatepassword({
				user_id,
				current_password: password.currentPassword,
				new_password: password.newPassword,
			});
			setSuccess('Password updated successfully');
			setTimeout(() => setShowUpdatePassword(false), 1500);
		} catch (err: any) {
			const message = err?.message || 'Failed to update password.';
			setError(message);
		} finally {
			setSavingPassword(false);
		}
	}, [password, user_id]);

	useEffect(() => {
		if (Platform.OS === 'web') document.title = 'Account Security - GatePass';
	}, []);

	return (
		<div className="flex h-full w-screen overflow-y-scroll bg-body">
			{isLargeScreen && <WebSidebar routes={menuRoutes} onNavigate={(route) => router.push(route as any)} />}
			<div className="web-body">
				<div className={`flex flex-col ${isLargeScreen ? 'mt-20 px-4 w-full' : 'mt-5 px-5'}`}>
					<Back type="short-arrow" />

					<div className="mt-10">
						<div className="flex justify-between">
							<h1 className={`${isLargeScreen ? 'text-4xl' : 'text-2xl font-ubuntu-medium'}`}>Account Security</h1>
						</div>
						<p className="text-xs font-inter-medium text-[#172024] mt-4 leading-[14px]">
							Manage your security settings and update your password for quick secure access.
						</p>
					</div>

					<div className="py-7 w-full mt-5">
						<div className="flex flex-col gap-4 mb-1">
							<div className="flex items-center rounded-lg px-5 bg-[#F7F9F9] h-14 w-full justify-between">
								<span className="text-[15px] font-inter-regular text-[#172024]">Change Password</span>
								<div
									onClick={() => {
										setError('');
										setSuccess('');
										setShowUpdatePassword(true);
									}}
									className="cursor-pointer"
								>
									<Image source={icons.rightIcon} style={{ width: 14, height: 14 }} resizeMode="contain" />
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			{showUpdatePassword && (
				<UpdatePassword
					setShowUpdatePassword={setShowUpdatePassword}
					error={error}
					success={success}
					savingPassword={savingPassword}
					setPassword={setPassword}
					password={password}
					showCurrent={showCurrent}
					showNew={showNew}
					showConfirm={showConfirm}
					confirmPasswordRef={confirmPasswordRef}
					setError={setError}
					setShowCurrent={setShowCurrent}
					setShowNew={setShowNew}
					setShowConfirm={setShowConfirm}
					setNewPassword={setNewPassword}
				/>
			)}
		</div>
	);
}
