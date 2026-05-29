import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { ActivityIndicator, Image, Platform, useWindowDimensions } from 'react-native';
import icons from '@/src/constants/icons';
import { useUserStore } from '@/src/lib/stores/userStore';
import { generateCode, getMyCode } from '@/src/lib/api/codes';
import { useMyProfile } from '@/src/lib/api/auth';
import { formatDateWithOrdinal, getWidthBreakpoint } from '@/src/lib/helpers';
import Back from '@/src/components/mobile/Back';
import WebSidebar from '@/src/components/web/WebSidebar';
import { menuRoutes } from '../../user/_layout';
import { User } from '@/src/types/user';

export default function MyProfile() {
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [code, setCode] = useState<string | null>(null);
	const [expiry, setExpiry] = useState<string | null>(null);
	const { data: profile } = useMyProfile();
	const setUser = useUserStore((state) => state.setUser);

	const user_id = useUserStore((state) => state.user_id);
	const estate_id = useUserStore((state) => state.estate_id);
	const first_name = useUserStore((state) => state.first_name);
	const last_name = useUserStore((state) => state.last_name);
	const home_address = useUserStore((state) => state.home_address);
	const email = useUserStore((state) => state.email);
	const phone_number = useUserStore((state) => state.phone_number);
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

	useEffect(() => {
		if (profile?.status) {
			setUser(profile as User);
		}
	}, [profile, setUser]);

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
				<div className={`flex flex-col ${isLargeScreen ? 'mt-20 px-4 w-full' : 'mt-5 md:px-5'}`}>
					<Back type="short-arrow" />

					<div className="mt-10">
						<div className="flex justify-between">
							<h1 className={`${isLargeScreen ? 'text-4xl' : 'text-2xl font-ubuntu-medium'}`}>My Profile</h1>
						</div>
						<p className="text-base text-tertiary mt-1">My personal details</p>
					</div>

					<div className="py-7 w-full mt-5">
						<div className={`flex gap-4 mb-1 ${isLargeScreen ? 'flex-row' : 'flex-col'}`}>
							<div className="flex capitalize items-center border rounded-lg px-5 bg-white text-base text-primary p-4 w-full justify-between border-grey">
								<div className="flex gap-10">
									<span>My access code:</span>
									<span className="tracking-[2px] uppercase">{code ? `${code.slice(0, 3)} ${code.slice(3)}` : '-------------'}</span>
								</div>
								<div onClick={handleGenerateCode}>
									{loading ? <ActivityIndicator size="large" color="#113E55" /> : <Image source={icons.refresh} style={{ width: 20, height: 20 }} resizeMode="contain" className="cursor-pointer" />}
								</div>
							</div>
						</div>

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

					<div className="mb-8 p-8 rounded-lg border border-[#CEE5ED] bg-[#f3fcfa] flex flex-col gap-4">
						{[
							{
								label: 'Name',
								value: `${first_name ?? ''} ${last_name ?? ''}`.trim(),
							},
							{
								label: 'Address',
								value: home_address,
							},
							{
								label: 'Email Address',
								value: email,
							},
							{
								label: 'Phone Number',
								value: phone_number,
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
			</div>
		</div>
	);
}
