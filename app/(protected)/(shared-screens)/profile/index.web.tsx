import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { ActivityIndicator, Image, Platform, useWindowDimensions } from 'react-native';
import icons from '@/src/constants/icons';
import { useUserStore } from '@/src/lib/stores/userStore';
import { generateCode, getMyCode } from '@/src/lib/api/codes';
import { formatDateWithOrdinal, getWidthBreakpoint } from '@/src/lib/helpers';
import Back from '@/src/components/mobile/Back';
import WebSidebar from '@/src/components/web/WebSidebar';
import { menuRoutes } from '../../user/_layout';

export default function MyProfile() {
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [code, setCode] = useState<string | null>(null);
	const [expiry, setExpiry] = useState<string | null>(null);

	const user_id = useUserStore.getState().user_id;
	const estate_id = useUserStore.getState().estate_id;
	const { width } = useWindowDimensions();

	const isLargeScreen = width > getWidthBreakpoint();

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
			console.error('Failed to generate code. Please try again.', error);
		} finally {
			setLoading(false);
		}
	}, [user_id, estate_id]);

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
			{isLargeScreen && <WebSidebar routes={menuRoutes} onNavigate={(route) => router.push(route as any)} />}
			<div className="web-body">
				{loading ? (
					<div className="flex justify-center items-center h-full">
						<p className="text-base text-tertiary">Loading...</p>
					</div>
				) : (
					<>
						<div className={`flex flex-col ${isLargeScreen ? 'mt-20 max-w-2xl mx-auto px-4 w-full' : 'mt-5 px-5'}`}>
							<Back type="short-arrow" />

							<div className="mt-10">
								<div className="flex justify-between">
									<h1 className={`${isLargeScreen ? 'text-4xl' : 'text-2xl font-ubuntu-medium'}`}>My Profile</h1>
								</div>
								<p className="text-base text-tertiary mt-1">My personal details</p>
							</div>

							{/* Code & Password Row */}
							<div className="py-7 w-full mt-5">
								<div className={`flex gap-4 mb-1 ${isLargeScreen ? 'flex-row' : 'flex-col'}`}>
									{/* Access Code */}
									<div className="flex capitalize items-center border rounded-lg px-5 bg-white text-base text-primary p-4 w-full justify-between border-grey">
										<div className="flex gap-10">
											<span>My access code:</span>
											<span className="tracking-[2px] uppercase">{code ? `${code.slice(0, 3)} ${code.slice(3)}` : '-------------'}</span>
										</div>
										<div onClick={handleGenerateCode}>{loading ? <ActivityIndicator size="large" color="#113E55" /> : <Image source={icons.refresh} style={{ width: 20, height: 20 }} resizeMode="contain" className="cursor-pointer" />}</div>
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
									{
										label: 'Name',
										value: `${useUserStore.getState().first_name} ${useUserStore.getState().last_name}`,
									},
									{
										label: 'Address',
										value: useUserStore.getState().home_address,
									},
									{
										label: 'Email Address',
										value: useUserStore.getState().email,
									},
									{
										label: 'Phone Number',
										value: useUserStore.getState().phone_number,
									},
								].map((item, index) => (
									<div key={item.label + index} className="flex gap-3 items-center">
										<span className="input-label-web w-36">{item.label} :</span>
										<span>{item.value}</span>
									</div>
								))}
							</div>

							<button onClick={() => router.push('/profile/edit')} className="self-end full-btn">
								Edit Request
							</button>
						</div>

						{!isLargeScreen && (
							<div className=" absolute bottom-0 right-0 left-0 flex justify-center items-center">
								<p className="text-tertiary font-bold text-[16px] p-5 font-UbuntuSans">Log Out</p>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
}
