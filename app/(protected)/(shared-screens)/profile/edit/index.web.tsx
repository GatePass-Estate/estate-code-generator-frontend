import { menuRoutes } from '@/app/(protected)/user/_layout';
import WebSidebar from '@/src/components/web/WebSidebar';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

export default function EditProfile() {
	const router = useRouter();

	useEffect(() => {
		if (Platform.OS === 'web') {
			document.title = 'Edit Profile - GatePass';
		}
	}, []);
	return (
		<div className="flex h-full w-screen overflow-y-scroll bg-body">
			<WebSidebar routes={menuRoutes.filter((el) => el.for == 'web' || el.for == 'both').map(({ name, title, link, activeIcon, inactiveIcon }) => ({ name, title, link, activeIcon, inactiveIcon }))} onNavigate={(route) => router.push(route as any)} />

			<div className="web-body">
				<div className="flex flex-col justify-center mt-10">
					<div>
						<h1 className="text-4xl">Edit Profile</h1>
						<p className="text-base text-tertiary mt-3">Send a request to edit your personal details</p>
					</div>

					<form className="py-7 flex flex-col gap-6 min-w-[400px]  md:min-w-[500px] lg:min-w-[600px]">
						<div className=" bg-white border border-[#b5c6c3] rounded-lg p-8 flex flex-col gap-6 ">
							<div className="flex flex-col gap-2">
								<label className="input-label-web">Name</label>
								<input type="text" placeholder="Your full name" className="input-style-web" />
							</div>
							<div className="flex flex-col gap-2">
								<label className="input-label-web">Email Address</label>
								<input type="email" placeholder="email@example.com" className="input-style-web" />
							</div>
							<div className="flex flex-col gap-2">
								<label className="input-label-web">Address</label>
								<input type="text" placeholder="Your address" className="input-style-web" />
							</div>
							<div className="flex flex-col gap-2">
								<label className="input-label-web">Phone Number</label>
								<input type="text" placeholder="Your phone number" className="input-style-web" />
							</div>
						</div>

						<div className="self-end flex gap-4">
							<button onClick={() => router.push('/profile')} type="button" className="text-primary font-medium cursor-pointer">
								Cancel Request
							</button>
							<button type="submit" onClick={() => router.push('/profile/edit')} className="self-end bg-primary text-white font-medium text-sm rounded-lg py-3 px-5 cursor-pointer">
								Send Request
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
