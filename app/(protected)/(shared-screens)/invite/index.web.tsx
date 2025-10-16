import QRCode from 'react-native-qrcode-svg';
import { MaterialIcons } from '@expo/vector-icons';
import WebSidebar from '@/src/components/web/WebSidebar';
import { menuRoutes } from '../../user/_layout';
import { useRouter } from 'expo-router';

const invite = {
	name: 'Sandra Happiness',
	address: 'Flat 1, 18A Olayinka Something Street, U3 Estate',
	date: '14/08/2023',
	timeframe: '6:23pm to 7:23pm',
	code: '56T73E',
};

export default function ShareInvitePage() {
	const router = useRouter();

	const handleCopy = () => {};

	const handleShare = () => {};

	return (
		<div className="flex h-full w-screen overflow-y-scroll bg-body">
			<WebSidebar routes={menuRoutes.filter((el) => el.for == 'web' || el.for == 'both').map(({ name, title, link, activeIcon, inactiveIcon }) => ({ name, title, link, activeIcon, inactiveIcon }))} onNavigate={(route) => router.push(route as any)} />

			<div className="web-body">
				<div className="flex flex-col justify-center gap-7 mt-10">
					<div>
						<p className="text-4xl">Share Invite</p>
						<p className="text-base text-tertiary mt-3">Share the information to your guest</p>
					</div>

					<div className="flex gap-9 mt-16">
						<div className="flex flex-col items-center">
							<div className="bg-[#F15A29] p-6 mb-5 rounded-md">
								<QRCode value={invite.code} size={180} backgroundColor="#fff" color="#fff" />
							</div>

							<div className="flex items-center mt-2 gap-2">
								<p className="text-4xl tracking-[12px] font-semibold text-primary">{invite.code}</p>
								<button onClick={handleCopy} className="ml-2 p-1">
									<MaterialIcons name="content-copy" size={22} color="#243a3f" />
								</button>
							</div>
						</div>

						<div className="flex flex-col gap-3 relative">
							<p className="text-tertiary mb-4 text-base absolute -top-10">Invite Details</p>

							<div className=" flex flex-col gap-3 border border-primary rounded-md px-5 py-7">
								<div>
									<p className="input-label-web">Name :</p>
									<p className="share-detail-style">{invite.name}</p>
								</div>
								<div>
									<p className="input-label-web">Address :</p>
									<p className="share-detail-style">{invite.address}</p>
								</div>
								<div>
									<p className="input-label-web">Date :</p>
									<p className="share-detail-style">{invite.date}</p>
								</div>
								<div>
									<p className="input-label-web">Timeframe :</p>
									<p className="share-detail-style">{invite.timeframe}</p>
								</div>
								<div>
									<p className="input-label-web">One time access code :</p>
									<p className="share-detail-style">{invite.code}</p>
								</div>
							</div>

							<button className="mt-6 bg-primary rounded-md py-3 items-center text-white font-medium text-sm" onClick={handleShare}>
								Share invite
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
