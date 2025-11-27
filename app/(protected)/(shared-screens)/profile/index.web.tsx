import { menuRoutes } from '../../user/_layout';
import { useRouter } from 'expo-router';
import WebSidebar from '@/src/components/web/WebSidebar';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { ActivityIndicator, Image, Platform, Pressable } from 'react-native';
import icons from '@/src/constants/icons';
import { useUserStore } from '@/src/lib/stores/userStore';
import { updatepassword } from '@/src/lib/api/user';
import { generateCode, getMyCode } from '@/src/lib/api/codes';
import { formatDateWithOrdinal } from '@/src/lib/helpers';
import { Animated, Easing } from 'react-native';

interface WebPasswordInputProps {
	label: string;
	placeholder: string;
	value: string;
	onChange: (value: string) => void;
	show: boolean;
	onToggle: () => void;
	disabled?: boolean;
	inputRef?: React.Ref<HTMLInputElement | null>;
}

const WebPasswordInput = ({ label, placeholder, value, onChange, show, onToggle, disabled, inputRef }: WebPasswordInputProps) => {
	return (
		<div className="flex flex-col gap-2">
			<label className="input-label-web">{label}</label>
			<div className="relative">
				<input type={show ? 'text' : 'password'} placeholder={placeholder} className="input-style-web w-full pr-12" value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} ref={inputRef as React.Ref<HTMLInputElement | null>} />
				<Pressable onPress={onToggle} className="absolute right-5 top-1/2 -translate-y-1/2" disabled={disabled}>
					<Image source={show ? icons.eye : icons.hiddenEye} style={{ width: 20, height: 20 }} resizeMode="contain" />
				</Pressable>
			</div>
		</div>
	);
};

export default function MyProfile() {
	const router = useRouter();
	const [showUpdatePassword, setShowUpdatePassword] = useState(false);
	const [savingPassword, setSavingPassword] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [password, setPassword] = useState({ currentPassword: '', newPassword: '' });
	const confirmPasswordRef = useRef<HTMLInputElement | null>(null);
	const [loading, setLoading] = useState(true);
	const [code, setCode] = useState<string | null>(null);
	const [expiry, setExpiry] = useState<string | null>(null);

	const [showCurrent, setShowCurrent] = useState(false);
	const [showNew, setShowNew] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);

	const user_id = useUserStore.getState().user_id;
	const estate_id = useUserStore.getState().estate_id;

	const fetchMyCode = useCallback(async () => {
		setLoading(true);
		try {
			const result = await getMyCode(user_id);
			setCode(result.hashed_code);
			setExpiry(result.valid_until);
		} catch (error) {
			console.error('Failed to fetch codes:', error);
		} finally {
			setLoading(false);
		}
	}, [user_id]);

	const handleGenerateCode = useCallback(async () => {
		setLoading(true);
		try {
			const result = await generateCode({ user_id, estate_id: estate_id ?? '' }, 'resident');
			setCode(result.hashed_code);
			setExpiry(result.valid_until);
		} catch (error) {
			setError('Failed to generate code. Please try again.');
		} finally {
			setLoading(false);
		}
	}, [user_id, estate_id]);

	const setNewPassword = useCallback(async () => {
		setSavingPassword(true);
		setError('');
		setSuccess('');

		const confirmValue = confirmPasswordRef.current?.value || '';

		if (password.newPassword !== confirmValue) {
			setError('New Password and Confirm Password do not match');
			setSavingPassword(false);
			return;
		}

		if (password.newPassword.length < 8 || password.currentPassword.length < 8) {
			setError('Password must be at least 8 characters long');
			setSavingPassword(false);
			return;
		}

		if (password.newPassword === password.currentPassword) {
			setError('New Password cannot be the same as Current Password');
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
		fetchMyCode();
		if (Platform.OS === 'web') document.title = 'My Profile - GatePass';
	}, [fetchMyCode]);

	const { expiring, formattedDate } = useMemo(() => {
		if (!expiry) return { expiring: false, formattedDate: null };
		const expDate = new Date(expiry);
		const now = new Date();
		const daysLeft = (expDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
		return {
			expiring: daysLeft <= 30,
			formattedDate: formatDateWithOrdinal(expDate),
		};
	}, [expiry]);

	return (
		<div className="flex h-full w-screen overflow-y-scroll bg-body">
			<WebSidebar routes={menuRoutes.filter((el) => el.for === 'web' || el.for === 'both').map((data) => data)} onNavigate={(route) => router.push(route as any)} />

			<div className="web-body">
				{loading ? (
					<div className="flex justify-center items-center h-full">
						<p className="text-base text-tertiary">Loading...</p>
					</div>
				) : (
					<>
						<div className="flex flex-col justify-center mt-20">
							<div>
								<h1 className="text-4xl">My Profile</h1>
								<p className="text-base text-tertiary mt-1">My personal details</p>
							</div>

							{/* Code & Password Row */}
							<div className="py-7 w-full mt-5">
								<div className="flex gap-4 mb-1">
									{/* Access Code */}
									<div className="flex capitalize items-center border rounded-lg px-5 bg-white text-base text-primary p-4 w-full justify-between border-grey">
										<div className="flex gap-10">
											<span>My access code:</span>
											<span className="tracking-[2px] uppercase">{code ? `${code.slice(0, 3)} ${code.slice(3)}` : '-------------'}</span>
										</div>
										<div onClick={handleGenerateCode}>{loading ? <ActivityIndicator size="large" color="#113E55" /> : <Image source={icons.refresh} style={{ width: 20, height: 20 }} resizeMode="contain" className="cursor-pointer" />}</div>
									</div>

									{/* Password */}
									<div className="flex capitalize items-center border rounded-lg px-5 bg-white text-base text-primary p-4 w-full justify-between border-grey">
										<div className="flex gap-10">
											<span>My Password:</span>
											<span className="tracking-[2px]">************</span>
										</div>
										<div
											onClick={() => {
												setError('');
												setSuccess('');
												setShowUpdatePassword(true);
											}}
											className="cursor-pointer"
										>
											<Image source={icons.edit} style={{ width: 20, height: 20 }} resizeMode="contain" />
										</div>
									</div>
								</div>

								{/* Expiry Warning */}
								{formattedDate && (
									<div className="flex items-center gap-2 mt-2">
										<Image source={expiring ? icons.warning : icons.warningInfo} style={{ width: 20, height: 20 }} resizeMode="contain" />
										<p className={`italic text-sm font-medium ${expiring ? 'text-tertiary' : 'text-primary'}`}>
											Code expires on {formattedDate}
											{expiring && ': Regenerate Code now'}
										</p>
									</div>
								)}
							</div>

							{/* Personal Details */}
							<div className="mb-8 p-8 rounded-lg border border-[#CEE5ED] bg-[#f3fcfa] flex flex-col gap-4">
								{[
									{ label: 'Name', value: `${useUserStore.getState().first_name} ${useUserStore.getState().last_name}` },
									{ label: 'Address', value: useUserStore.getState().home_address },
									{ label: 'Email Address', value: useUserStore.getState().email },
									{ label: 'Phone Number', value: useUserStore.getState().phone_number },
								].map((item) => (
									<div key={item.label} className="flex gap-3 items-center">
										<span className="input-label-web w-36">{item.label} :</span>
										<span>{item.value}</span>
									</div>
								))}
							</div>

							<button onClick={() => router.push('/profile/edit')} className="self-end full-btn">
								Edit Request
							</button>
						</div>
					</>
				)}
			</div>

			{showUpdatePassword && (
				<div className="fixed inset-0 z-50 flex items-center justify-center">
					<div className="absolute inset-0 bg-primary opacity-80" onClick={() => setShowUpdatePassword(false)} />
					<div className="bg-white rounded-lg p-8 py-16 pt-32 z-10 min-w-[450px] relative">
						<div className="cursor-pointer absolute right-6 -mt-16" onClick={() => setShowUpdatePassword(false)}>
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
								onChange={(v) => {
									setError('');
									setPassword((p) => ({ ...p, currentPassword: v }));
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
									setPassword((p) => ({ ...p, newPassword: v }));
								}}
								show={showNew}
								onToggle={() => setShowNew(!showNew)}
								disabled={savingPassword}
							/>

							<WebPasswordInput
								label="Confirm new password"
								placeholder="Confirm new password"
								value={confirmPasswordRef.current?.value || ''}
								onChange={(v) => {
									if (confirmPasswordRef.current) confirmPasswordRef.current.value = v;
								}}
								show={showConfirm}
								onToggle={() => setShowConfirm(!showConfirm)}
								disabled={savingPassword}
								inputRef={confirmPasswordRef}
							/>
						</div>

						<div className="flex justify-center gap-3">
							<button className={`full-btn !px-16 ${savingPassword && 'opacity-65'}`} onClick={setNewPassword} disabled={savingPassword}>
								{savingPassword ? 'Saving...' : 'Save Password'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
