import QRCode from 'react-native-qrcode-svg';
import WebSidebar from '@/src/components/web/WebSidebar';
import { menuRoutes } from '../../user/_layout';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import Modal from '@/src/components/web/Modal';
import { useEffect, useState } from 'react';
import icons from '@/src/constants/icons';

export default function ShareInvitePage() {
	const router = useRouter();
	const [showCopyModal, setShowCopyModal] = useState(false);
	const [showShareOptions, setShowShareOptions] = useState(false);
	let { name: visitor_fullname, code: codeParam, date, timeframe, address } = useLocalSearchParams();

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(codeParam as string);
			setShowCopyModal(true);
		} catch (error) {
			console.error('Failed to copy to clipboard:', error);
		}
	};

	const handleShare = async () => {
		if (await tryNativeShare()) return;
		setShowShareOptions(true);
	};

	const shareText = () => {
		const parts: string[] = [];
		if (visitor_fullname) parts.push(`Name: ${visitor_fullname}`);
		if (address) parts.push(`Address: ${address}`);
		if (date) parts.push(`Date: ${date}`);
		if (timeframe) parts.push(`Timeframe: ${timeframe}`);
		parts.push(`Access code: ${codeParam}`);
		return parts.join('\n');
	};

	const tryNativeShare = async () => {
		if ((navigator as any).share) {
			try {
				await (navigator as any).share({ title: 'GatePass Invite', text: shareText() });
				setShowShareOptions(false);
				return true;
			} catch (err) {
				return false;
			}
		}
		return false;
	};

	const openWindow = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');

	const shareToTwitter = async () => {
		openWindow(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText())}`);
		setShowShareOptions(false);
	};

	const shareToFacebook = async () => {
		openWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(shareText())}`);
		setShowShareOptions(false);
	};

	const shareToWhatsApp = async () => {
		openWindow(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText())}`);
		setShowShareOptions(false);
	};

	const shareToLinkedIn = async () => {
		openWindow(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`);
		setShowShareOptions(false);
	};

	const shareByEmail = async () => {
		const subject = encodeURIComponent('GatePass Invite');
		const body = encodeURIComponent(shareText());
		window.location.href = `mailto:?subject=${subject}&body=${body}`;
		setShowShareOptions(false);
	};

	useEffect(() => {
		if (Platform.OS === 'web') document.title = 'Invite Share - GatePass';
	}, []);

	return (
		<div className="flex h-full w-screen overflow-y-scroll bg-body">
			<WebSidebar routes={menuRoutes.filter((el) => el.for == 'web' || el.for == 'both').map((data) => data)} onNavigate={(route) => router.push(route as any)} />

			<div className="web-body">
				<div className="flex flex-col justify-center gap-7 mt-20">
					<div>
						<h1 className="text-4xl">Share Invite</h1>
						<p className="text-base text-tertiary mt-1">Share the information to your guest</p>
					</div>

					<div className="flex gap-12 mt-14">
						<div className="flex flex-col items-center">
							<div className="bg-[#F15A29] p-6 mb-5 rounded-md shadow-[4px_4px_36px_0px_#D6CFCB]">
								<QRCode value={codeParam as string} size={350} backgroundColor="#F15A29" color="#fff" />
							</div>

							<div className="flex items-center mt-2">
								<h3 className="text-5xl tracking-[24px] font-bold text-primary uppercase">{codeParam}</h3>
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
								<p className="share-detail-style">{visitor_fullname}</p>

								<p className="input-label-web text-base">Address :</p>
								<p className="share-detail-style">{address}</p>

								<p className="input-label-web text-base">Date :</p>
								<p className="share-detail-style">{date}</p>

								<p className="input-label-web text-base">Timeframe :</p>
								<p className="share-detail-style">{timeframe}</p>

								<p className="input-label-web text-base">One time access code :</p>
								<p className="share-detail-style uppercase">{codeParam}</p>
							</div>

							{showShareOptions && (
								<div className="mb-4 p-4 bg-white border rounded flex gap-3 items-center justify-center">
									<button
										onClick={() => {
											shareToTwitter();
										}}
										className="share-btn"
										aria-label="Share to Twitter"
									>
										<FontAwesome name="twitter" size={28} color="#1DA1F2" />
									</button>
									<button
										onClick={() => {
											shareToFacebook();
										}}
										className="share-btn"
										aria-label="Share to Facebook"
									>
										<FontAwesome name="facebook" size={28} color="#1877F2" />
									</button>
									<button
										onClick={() => {
											shareToWhatsApp();
										}}
										className="share-btn"
										aria-label="Share to WhatsApp"
									>
										<FontAwesome name="whatsapp" size={28} color="#25D366" />
									</button>
									<button
										onClick={() => {
											shareToLinkedIn();
										}}
										className="share-btn"
										aria-label="Share to LinkedIn"
									>
										<FontAwesome name="linkedin" size={28} color="#0A66C2" />
									</button>
									<button
										onClick={() => {
											shareByEmail();
										}}
										className="share-btn"
										aria-label="Share by Email"
									>
										<FontAwesome name="envelope" size={28} color="#6B7280" />
									</button>
									<button onClick={() => setShowShareOptions(false)} className="share-btn" aria-label="Close share options">
										Close
									</button>
								</div>
							)}

							<button className="full-btn" onClick={handleShare}>
								Share invite
							</button>
						</div>
					</div>
				</div>
			</div>

			{showCopyModal && <Modal closeModal={() => setShowCopyModal(false)} heading={'Code Copied'} message={`The access code ${codeParam} has been copied to your clipboard.`} cancelText={'Close'} />}
		</div>
	);
}
