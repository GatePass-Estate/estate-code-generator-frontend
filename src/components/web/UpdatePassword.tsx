import icons from '@/src/constants/icons';
import React, { useState } from 'react';
import { Image } from 'react-native';
import WebPasswordInput from './WebPasswordInput';

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

const UpdatePassword = ({
	setShowUpdatePassword,
	error,
	success,
	savingPassword,
	setPassword,
	password,
	showCurrent,
	showNew,
	showConfirm,
	confirmPasswordRef,
	setError,
	setShowCurrent,
	setShowNew,
	setShowConfirm,
	setNewPassword,
}: UpdatePasswordProps) => {
	const [confirmValue, setConfirmValue] = useState<string>(confirmPasswordRef?.current?.value || '');

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-6">
			<div className="absolute inset-0 bg-primary opacity-80" onClick={() => setShowUpdatePassword(false)} />
			<div className="bg-white rounded-lg z-10 relative w-full min-w-0 max-h-[min(100vh-2rem,900px)] overflow-y-auto p-8 py-16 pt-32 max-w-lg min-w-[min(450px,calc(100vw-2rem))]">
				<div className="cursor-pointer absolute right-6 top-6" onClick={() => setShowUpdatePassword(false)}>
					<Image source={icons.cancel} style={{ width: 40, height: 40 }} resizeMode="contain" />
				</div>

				{error && <div className="text-danger font-medium my-4 p-3 bg-danger/20 rounded">{error}</div>}

				{success && <div className="text-green-500 font-medium my-4 p-3 bg-green-500/20 rounded">{success}</div>}

				<h4 className="text-4xl font-UbuntuSans font-normal mb-2 text-black text-center">New Password</h4>

				<div className="flex flex-col gap-8 my-10">
					<WebPasswordInput
						label="Current Password"
						placeholder="Enter current password"
						value={password.currentPassword}
						onChange={(value) => {
							setError('');
							setPassword({ ...password, currentPassword: value });
						}}
						show={showCurrent}
						onToggle={() => setShowCurrent(!showCurrent)}
						disabled={savingPassword}
					/>

					<WebPasswordInput
						label="Create New Password"
						placeholder="Enter new password"
						value={password.newPassword}
						onChange={(value) => {
							setError('');
							setPassword({ ...password, newPassword: value });
						}}
						show={showNew}
						onToggle={() => setShowNew(!showNew)}
						disabled={savingPassword}
					/>

					<WebPasswordInput
						label="Confirm new password"
						placeholder="Confirm new password"
						value={confirmValue}
						onChange={setConfirmValue}
						show={showConfirm}
						onToggle={() => setShowConfirm(!showConfirm)}
						disabled={savingPassword}
						inputRef={confirmPasswordRef}
					/>
				</div>

				<div className="flex justify-center w-full">
					<button
						className={`full-btn !px-16 w-full max-w-full ${savingPassword && 'opacity-65'}`}
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
