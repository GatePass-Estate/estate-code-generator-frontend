import { menuRoutes } from '@/app/(protected)/user/_layout';
import WebSidebar from '@/src/components/web/WebSidebar';
import { useUserStore } from '@/src/lib/stores/userStore';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

export const EditProfileForm = ({ centralize = false }: { centralize?: boolean }) => {
	const router = useRouter();

	return (
		<div className="flex flex-col justify-center mt-20">
			<div>
				<h1 className={`text-4xl ${centralize && 'text-center'}`}>Edit Profile</h1>
				<p className={`text-base text-tertiary mt-1 ${centralize && 'text-center'}`}>Send a request to edit your personal details</p>
			</div>
			<form className="py-7 flex flex-col gap-6 min-w-[400px]  md:min-w-[500px] lg:min-w-[600px]">
				<div
					className=" bg-white border-micro
							 border-primary rounded-lg p-8 flex flex-col gap-6 "
				>
					<div className="flex flex-col gap-2">
						<label className="input-label-web">Name</label>
						<input type="text" placeholder={`${useUserStore.getState().first_name} ${useUserStore.getState().last_name}`} className="input-style-web" required />
					</div>

					<div className="flex flex-col gap-2">
						<label className="input-label-web">Email Address</label>
						<input type="email" placeholder={`${useUserStore.getState().email}`} className="input-style-web" required />
					</div>

					{!centralize && (
						<div className="flex flex-col gap-2">
							<label className="input-label-web">Address</label>
							<input type="text" placeholder={`${useUserStore.getState().home_address}`} className="input-style-web" required />
						</div>
					)}

					<div className="flex flex-col gap-2">
						<label className="input-label-web">Phone Number</label>
						<input type="text" placeholder={`${useUserStore.getState().phone_number}`} className="input-style-web" required />
					</div>
				</div>

				<div className="self-end flex gap-4">
					<button onClick={() => router.back()} type="button" className={`text-primary font-medium py-3 px-14 cursor-pointer ${centralize && 'border border-accent px-20 rounded-lg'}`}>
						{centralize ? 'Back' : 'Cancel Request'}
					</button>

					<button type="submit" onClick={() => router.push('/profile/edit')} className="self-end bg-primary text-white font-medium text-sm rounded-lg py-3 px-14 cursor-pointer">
						Send Request
					</button>
				</div>
			</form>
		</div>
	);
};

export default function EditProfile() {
	const router = useRouter();

	useEffect(() => {
		if (Platform.OS === 'web') document.title = 'Edit Profile - GatePass';
	}, []);

	return (
		<div className="flex h-full w-screen overflow-y-scroll bg-body">
			<WebSidebar routes={menuRoutes.filter((el) => el.for == 'web' || el.for == 'both').map((data) => data)} onNavigate={(route) => router.push(route as any)} />

			<div className="web-body">
				<EditProfileForm />
			</div>
		</div>
	);
}
