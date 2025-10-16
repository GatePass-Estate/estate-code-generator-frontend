import { menuRoutes } from '../../user/_layout';
import { useRouter } from 'expo-router';
import WebSidebar from '@/src/components/web/WebSidebar';
import { useEffect } from 'react';
import { Platform } from 'react-native';

export default function MyProfile() {
	const router = useRouter();

	useEffect(() => {
		if (Platform.OS === 'web') {
			document.title = 'My Profile - GatePass';
		}
	}, []);
	return (
		<div className="flex h-full w-screen overflow-y-scroll bg-body">
			<WebSidebar routes={menuRoutes.filter((el) => el.for == 'web' || el.for == 'both').map(({ name, title, link, activeIcon, inactiveIcon }) => ({ name, title, link, activeIcon, inactiveIcon }))} onNavigate={(route) => router.push(route as any)} />

			<div className="web-body">
				<div className="flex flex-col justify-center mt-10">
					<div>
						<h1 className="text-4xl">My Profile</h1>
						<p className="text-base text-tertiary mt-3">My personal details</p>
					</div>

					<div className="py-7">
						<div className="flex gap-4 mb-1">
							<div className="flex capitalize items-center border rounded-lg px-5 bg-white text-base text-primary gap-4 p-4">
								<span>My access code:</span>
								<span className="uppercase tracking-[2px] font-bold">90t76E</span>
								<button className="border-none cursor-pointer bg-none">
									<span role="img" aria-label="refresh">
										🔄
									</span>
								</button>
							</div>

							<div className="flex capitalize items-center border rounded-lg px-5 bg-white text-base text-primary gap-4 p-4">
								<span>My Password:</span>
								<span className="tracking-[2px]">************</span>
								<button className="border-none cursor-pointer bg-none">
									<span role="img" aria-label="edit">
										✏️
									</span>
								</button>
							</div>
						</div>

						<div>
							<span className="italic text-sm text-danger">Code expires on 31st May 2003 : Regenerate Code now</span>
						</div>
					</div>

					<div className="mb-8 p-8 rounded-lg border border-[#b5c6c3] bg-[#f3fcfa] flex flex-col gap-3">
						<div className="flex gap-3 items-center">
							<span className="input-label-web">Name :</span>
							<span>Sandra Happiness</span>
						</div>
						<div className="flex gap-3 items-center">
							<span className="input-label-web">Address :</span>
							<span>Flat 1, 18A Olayinka Something Street, U3 Estate</span>
						</div>
						<div className="flex gap-3 items-center">
							<span className="input-label-web">Email Address :</span>
							<span>sandaroj@hmo.com</span>
						</div>
						<div className="flex gap-3 items-center">
							<span className="input-label-web">Phone Number :</span>
							<span>0902 443 422 3324</span>
						</div>
					</div>

					<button onClick={() => router.push('/profile/edit')} className="self-end bg-primary text-white font-medium text-sm rounded-lg py-3 px-5 cursor-pointer">
						Edit Request
					</button>
				</div>
			</div>
		</div>
	);
}
