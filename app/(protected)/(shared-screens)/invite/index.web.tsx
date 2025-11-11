import QRCode from 'react-native-qrcode-svg';
import WebSidebar from '@/src/components/web/WebSidebar';
import { menuRoutes } from '../../user/_layout';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image, Platform } from 'react-native';
import Modal from '@/src/components/web/Modal';
import { useEffect, useState } from 'react';
import { getAllCodes } from '@/src/lib/api/codes';
import { useUserStore } from '@/src/lib/stores/userStore';
import { Codes } from '@/src/types/codes';
import icons from '@/src/constants/icons';

export default function ShareInvitePage() {
	const router = useRouter();
	const [showCopyModal, setShowCopyModal] = useState(false);
	const { code: codeParam } = useLocalSearchParams();

	const [code, setCode] = useState<
		Codes & {
			timeframe?: string;
			address?: string | null;
			date?: string;
		}
	>();

	const [loading, setLoading] = useState(true);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(code?.hashed_code as string);
			setShowCopyModal(true);
		} catch (error) {
			console.error('Failed to copy to clipboard:', error);
		}
	};

	const handleShare = () => {};

	const fetchData = async () => {
		setLoading(true);

		try {
			const result = await getAllCodes(useUserStore.getState().user_id);
			result.items
				.filter((code) => code.hashed_code == codeParam)
				.forEach((matchedCode) => {
					let date = matchedCode.valid_until;
					const iso = String(date ?? '')
						.replace(' ', 'T')
						.replace(/([+-]\d{2})(\d{2})$/, '$1:$2'); // turn "+0000" into "+00:00"
					const parsed = new Date(iso);

					let formattedDate = 'Invalid date';
					let timeframe = 'Unknown';

					if (!isNaN(parsed.getTime())) {
						const day = String(parsed.getDate()).padStart(2, '0');
						const month = String(parsed.getMonth() + 1).padStart(2, '0');
						const year = parsed.getFullYear();
						formattedDate = `${day}/${month}/${year}`;

						const diffMs = parsed.getTime() - Date.now();
						if (diffMs <= 0) {
							timeframe = 'Expired';
						} else {
							timeframe = (() => {
								const endDate = parsed;
								const startDate = new Date(endDate.getTime() - 60 * 60 * 1000); // 1 hour window
								const formatTime = (d: Date) => d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true }).replace(/\s+/g, '').toLowerCase();
								return `${formatTime(startDate)} to ${formatTime(endDate)}`;
							})();
						}
					}

					setCode({
						...matchedCode,
						timeframe,
						address: `${useUserStore.getState().home_address}, ${useUserStore.getState().estate_name}.`,
						date: formattedDate,
					});
				});
		} catch (error) {
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
		if (Platform.OS === 'web') document.title = 'Invite Share - GatePass';
	}, []);

	return (
		<div className="flex h-full w-screen overflow-y-scroll bg-body">
			<WebSidebar routes={menuRoutes.filter((el) => el.for == 'web' || el.for == 'both').map((data) => data)} onNavigate={(route) => router.push(route as any)} />

			<div className="web-body">
				{loading ? (
					<div className="flex justify-center items-center h-full">
						<p className="text-base text-tertiary">Loading invite...</p>
					</div>
				) : (
					<div className="flex flex-col justify-center gap-7 mt-20">
						<div>
							<h1 className="text-4xl">Share Invite</h1>
							<p className="text-base text-tertiary mt-1">Share the information to your guest</p>
						</div>

						<div className="flex gap-12 mt-14">
							<div className="flex flex-col items-center">
								<div className="bg-[#F15A29] p-6 mb-5 rounded-md shadow-[4px_4px_36px_0px_#D6CFCB]">
									<QRCode value={code?.hashed_code as string} size={350} backgroundColor="#F15A29" color="#fff" />
								</div>

								<div className="flex items-center mt-2">
									<h3 className="text-5xl tracking-[24px] font-bold text-primary uppercase">{code?.hashed_code}</h3>
									<button onClick={handleCopy} className="">
										<Image source={icons.copyIcon} style={{ width: 40, height: 40 }} resizeMode="contain" />
									</button>
								</div>
							</div>

							<div className="flex flex-col gap-3 relative">
								<p className="text-tertiary mb-4 text-base absolute -top-8">Invite Details</p>

								<div
									className=" flex flex-col gap-3 border-micro
							 border-primary rounded-md p-8 pb-12 min-w-[450px]"
								>
									<p className="input-label-web text-base">Name :</p>
									<p className="share-detail-style">{code?.visitor_fullname}</p>

									<p className="input-label-web text-base">Address :</p>
									<p className="share-detail-style">{code?.address}</p>

									<p className="input-label-web text-base">Date :</p>
									<p className="share-detail-style">{code?.date}</p>

									<p className="input-label-web text-base">Timeframe :</p>
									<p className="share-detail-style">{code?.timeframe}</p>

									<p className="input-label-web text-base">One time access code :</p>
									<p className="share-detail-style uppercase">{code?.hashed_code}</p>
								</div>

								<button className="full-btn" onClick={handleShare}>
									Share invite
								</button>
							</div>
						</div>
					</div>
				)}
			</div>

			{showCopyModal && <Modal closeModal={() => setShowCopyModal(false)} heading={'Code Copied'} message={`The access code ${code?.hashed_code} has been copied to your clipboard.`} cancelText={'Close'} />}
		</div>
	);
}
