import WebSidebar from '@/src/components/web/WebSidebar';
import { router, usePathname } from 'expo-router';
import { useEffect, useState, ChangeEvent } from 'react';
import { Image, Platform, ActivityIndicator } from 'react-native';
import WebNavLink from '@/src/components/web/WebNavLink';
import { menuRoutes } from '@/app/(protected)/user/_layout';
import { adminRoutes } from '../../_layout';
import icons from '@/src/constants/icons';
import Modal from '@/src/components/web/Modal';
import { registerUser, activateUser } from '@/src/lib/api/user';
import { useUserStore } from '@/src/lib/stores/userStore';
import { RegisterUserPayload } from '@/src/types/user';

export default function RegisterUserWeb() {
	useEffect(() => {
		if (Platform.OS === 'web') document.title = 'Add User - Admin Access - GatePass';
	}, []);

	const pathname = usePathname();

	function onNavigate(route: string): void {
		router.push(route as any);
	}

	return (
		<div className="flex h-full w-screen overflow-y-scroll bg-body">
			<WebSidebar routes={menuRoutes.filter((el) => el.for === 'web' || el.for === 'both').map((data) => data)} onNavigate={onNavigate} />

			<div className="web-body pb-20">
				<div className="mt-20 mb-10">
					<div className="flex items-center justify-between mb-8">
						<h1 className="text-5xl font-ubuntu-regular text-grey">Admin Access</h1>
					</div>

					<div className="grid grid-cols-4 gap-9 md:grid-cols-12 mb-10">
						<div className="flex flex-col gap-5 w-full col-span-2">
							{adminRoutes.map(({ name, title, link, icon }) => {
								const isActive = pathname === link;

								return (
									<div key={name} onClick={() => onNavigate(link)} className={`flex gap-3 items-center cursor-pointer p-3 rounded-lg transition-all ${isActive ? 'bg-accent text-primary font-medium' : 'hover:bg-accent hover:text-primary hover:font-medium'}`}>
										<Image source={icon} style={{ width: 24, height: 24 }} resizeMode="contain" />
										<WebNavLink color="primary">{title}</WebNavLink>
									</div>
								);
							})}
						</div>

						<div className="col-span-10"></div>
					</div>
				</div>
			</div>
		</div>
	);
}
