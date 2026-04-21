import icons from '@/src/constants/icons';
import React, { useState } from 'react';
import { Image, useWindowDimensions } from 'react-native';
import WebPasswordInput from './WebPasswordInput';
import { getWidthBreakpoint } from '@/src/lib/helpers';

interface UpdatePasswordProps {
	setShowUpdatePassword: (show: boolean) => void;
	error: string;
	success: string;
	savingPassword: boolean;
	setPassword: (password: { currentPassword: string; newPassword: string }) => void;
	password: { currentPassword: string; newPassword: string };
	showCurrent: boolean;
	showNew: boolean;
	showConfirm: boolean;
	confirmPasswordRef: React.RefObject<HTMLInputElement | null>;
	setError: (error: string) => void;
	setShowCurrent: (show: boolean) => void;
	setShowNew: (show: boolean) => void;
	setShowConfirm: (show: boolean) => void;
	setNewPassword: () => void;
}

const UpdatePassword = ({ setShowUpdatePassword, error, success, savingPassword, setPassword, password, showCurrent, showNew, showConfirm, confirmPasswordRef, setError, setShowCurrent, setShowNew, setShowConfirm, setNewPassword }: UpdatePasswordProps) => {
	const [confirmValue, setConfirmValue] = useState<string>(confirmPasswordRef?.current?.value || '');

	const { width } = useWindowDimensions();
	const isLargeScreen = width > getWidthBreakpoint();
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
			<div className="absolute inset-0 bg-primary opacity-80" onClick={() => setShowUpdatePassword(false)} />
			<div
				className={`bg-white rounded-lg z-10 relative w-full min-w-0 max-h-[min(100vh-2rem,900px)] overflow-y-auto ${
					isLargeScreen
						? 'p-8 py-16 pt-32 min-w-[min(450px,calc(100vw-2rem))] max-w-lg'
						: 'p-5 pt-12 pb-10 max-w-md'
				}`}
			>
				<div className="cursor-pointer absolute right-4 top-4 sm:right-6 sm:top-6" onClick={() => setShowUpdatePassword(false)}>
					<Image source={icons.cancel} style={{ width: isLargeScreen ? 40 : 32, height: isLargeScreen ? 40 : 32 }} resizeMode="contain" />
				</div>

				{error && <div className="text-danger font-medium my-4 p-3 bg-danger/20 rounded">{error}</div>}

				{success && <div className="text-green-500 font-medium my-4 p-3 bg-green-500/20 rounded">{success}</div>}

				<h4 className={`${isLargeScreen ? 'text-4xl' : 'text-2xl'} font-UbuntuSans font-normal mb-2 text-black text-center`}>New Password</h4>

				<div className="flex flex-col gap-6 sm:gap-8 my-6 sm:my-10">
					<WebPasswordInput
						label="Current Password"
						placeholder="Enter current password"
						value={password.currentPassword}
						onChange={(v) => {
							setError('');
							setPassword({ ...password, currentPassword: v });
						}}
						show={showCurrent}
						onToggle={() => setShowCurrent(!showCurrent)}
						disabled={savingPassword}
					/>

					<WebPasswordInput
						label="Create New Password"
						placeholder="Enter new password"
						value={password.newPassword}
						onChange={(v) => {
							setError('');
							setPassword({ ...password, newPassword: v });
						}}
						show={showNew}
						onToggle={() => setShowNew(!showNew)}
						disabled={savingPassword}
					/>

					<WebPasswordInput
						label="Confirm new password"
						placeholder="Confirm new password"
						value={confirmValue}
						onChange={(v) => {
							setConfirmValue(v);
						}}
						show={showConfirm}
						onToggle={() => setShowConfirm(!showConfirm)}
						disabled={savingPassword}
						inputRef={confirmPasswordRef}
					/>
				</div>

				<div className="flex justify-center gap-3 w-full">
					<button
						className={`full-btn w-full sm:w-auto !px-8 sm:!px-16 max-w-full ${savingPassword && 'opacity-65'}`}
						onClick={setNewPassword}
						disabled={savingPassword}
					>
						{savingPassword ? 'Saving...' : 'Save Password'}
					</button>
				</div>
			</div>
		</div>
	);
};

export default UpdatePassword;
