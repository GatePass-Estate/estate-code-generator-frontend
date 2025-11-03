import { menuRoutes } from '../../user/_layout';
import { useRouter } from 'expo-router';
import WebSidebar from '@/src/components/web/WebSidebar';
import { useEffect, useRef, useState } from 'react';
import { Image, Platform } from 'react-native';
import icons from '@/src/constants/icons';
import { useUserStore } from '@/src/lib/stores/userStore';
import { updatepassword } from '@/src/lib/api/user';
import { generateCode, getMyCode } from '@/src/lib/api/codes';

export default function MyProfile() {
	const router = useRouter();
	const [showUpdatePassword, setShowUpdatePassword] = useState(false);
	const [savingPassword, setSavingPassword] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [password, setPassword] = useState({ currentPassword: '', newPassword: '' });
	const confirmPasswordRef = useRef(null);
	const [loading, setLoading] = useState(true);
	const [code, setCode] = useState<string | null>(null);
	const [expiry, setExpiry] = useState<string | null>(null);

	const setNewPassword = async () => {
		setSavingPassword(true);
		setError('');
		setSuccess('');

		if (password.newPassword !== (confirmPasswordRef.current as any).value) {
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
			await updatepassword({ user_id: useUserStore.getState().user_id, current_password: password.currentPassword, new_password: password.newPassword });
			setSuccess('Password updated successfully');
		} catch (err) {
			console.log(err);

			const message = typeof err === 'string' ? err : err instanceof Error ? err.message : 'Failed to update password.';
			setError(message);
		} finally {
			setSavingPassword(false);
		}
	};

	const fetchMyCode = async () => {
		setLoading(true);
		try {
			const result = await getMyCode(useUserStore.getState().user_id);
			setCode(result.hashed_code);
			setExpiry(result.valid_until);
		} catch (error) {
			console.error('Failed to fetch codes:', error);
		} finally {
			setLoading(false);
		}
	};

	async function handleGenerateCode() {
		setLoading(true);
		try {
			const result = await generateCode(
				{
					user_id: useUserStore.getState().user_id,
					estate_id: useUserStore.getState().estate_id ?? '',
				},
				'resident'
			);
			setCode(result.hashed_code);
			setExpiry(result.valid_until);
		} catch (error) {
			setError('Failed to generate code. Please try again.');
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		fetchMyCode();
		if (Platform.OS === 'web') document.title = 'My Profile - GatePass';
	}, []);

	const isCloseToExpiry = (): boolean => {
		if (!expiry) return false;
		const expiryDate = new Date(expiry);
		const currentDate = new Date();
		const timeDiff = expiryDate.getTime() - currentDate.getTime();
		const daysDiff = timeDiff / (1000 * 3600 * 24);
		return daysDiff <= 30;
	};

	return (
		<div className="flex h-full w-screen overflow-y-scroll bg-body">
			<WebSidebar routes={menuRoutes.filter((el) => el.for == 'web' || el.for == 'both').map(({ name, title, link, activeIcon, inactiveIcon }) => ({ name, title, link, activeIcon, inactiveIcon }))} onNavigate={(route) => router.push(route as any)} />

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

							<div className="py-7 w-full mt-5">
								<div className="flex gap-4 mb-1">
									<div className="flex capitalize items-center border rounded-lg px-5 bg-white text-base text-primary p-4 w-full justify-between border-grey">
										<div className="flex gap-10">
											<span>My access code:</span>
											<span className="tracking-[2px] uppercase">{code ? code : '-------------'}</span>
										</div>

										<div onClick={handleGenerateCode}>
											<Image source={icons.refresh} style={{ width: 20, height: 20 }} resizeMode="contain" className="cursor-pointer" />
										</div>
									</div>

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
										>
											<Image source={icons.edit} style={{ width: 20, height: 20 }} resizeMode="contain" className="cursor-pointer" />
										</div>
									</div>
								</div>

								{isCloseToExpiry() && (
									<div className="flex items-center gap-2 mt-2">
										<Image source={icons.warning} style={{ width: 20, height: 20 }} resizeMode="contain" />

										<p className="italic text-sm text-danger font-medium">
											Code expires on 31st May 2003 : <span>Regenerate Code now</span>
										</p>
									</div>
								)}
							</div>

							<div className="mb-8 p-8 rounded-lg border border-[#CEE5ED] bg-[#f3fcfa] flex flex-col gap-4">
								<div className="flex gap-3 items-center">
									<span className="input-label-web w-36">Name :</span>
									<span>{`${useUserStore.getState().first_name} ${useUserStore.getState().last_name}`}</span>
								</div>
								<div className="flex gap-3 items-center">
									<span className="input-label-web w-36">Address :</span>
									<span>{useUserStore.getState().home_address}</span>
								</div>
								<div className="flex gap-3 items-center">
									<span className="input-label-web w-36">Email Address :</span>
									<span>{useUserStore.getState().email}</span>
								</div>
								<div className="flex gap-3 items-center">
									<span className="input-label-web w-36">Phone Number :</span>
									<span>{useUserStore.getState().phone_number}</span>
								</div>
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

						{error && (
							<div className="text-danger font-medium my-4 p-3 bg-danger/20">
								<span>{error}</span>
							</div>
						)}

						{success && (
							<div className="text-green-500 font-medium my-4 p-3 bg-green-500/20">
								<span>{success}</span>
							</div>
						)}

						<h4 className="text-4xl font-UbuntuSans font-normal mb-2 text-black text-center"> New Password</h4>

						<div className="flex flex-col gap-8 my-10">
							<div className="flex flex-col gap-2">
								<label className="input-label-web">Current Password</label>
								<input
									type="password"
									placeholder="Enter current password"
									className="input-style-web"
									required
									onChange={(e) => {
										setError('');
										setPassword({
											...password,
											currentPassword: e.target.value,
										});
									}}
								/>
							</div>
							<div className="flex flex-col gap-2">
								<label className="input-label-web">Create New Password</label>
								<input
									type="password"
									placeholder="Enter new password"
									className="input-style-web"
									required
									onChange={(e) => {
										setError('');
										setPassword({
											...password,
											newPassword: e.target.value,
										});
									}}
								/>
							</div>
							<div className="flex flex-col gap-2">
								<label className="input-label-web">Confirm new password</label>
								<input type="password" placeholder="Confirm new password" className="input-style-web" required ref={confirmPasswordRef} />
							</div>
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
