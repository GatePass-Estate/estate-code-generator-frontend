import WebNavLink from './WebNavLink';
import { Image, useWindowDimensions } from 'react-native';
import images from '@/src/constants/images';
import { usePathname } from 'expo-router';
import { useAuth } from '@/src/hooks/useAuthContext';
import { menuRouteType } from '@/src/types/general';
import { useUserStore } from '@/src/lib/stores/userStore';
import { sharedStyles } from '@/src/theme/styles';
import { getWidthBreakpoint } from '@/src/lib/helpers';

type WebSidebarProps = {
	routes: menuRouteType[];
	onNavigate: (route: string) => void;
};

export default function WebSidebar({ routes, onNavigate }: WebSidebarProps) {
	const pathname = usePathname();
	const { signOut } = useAuth();

	const userRole = useUserStore.getState().role;
	const { width } = useWindowDimensions();
	const isLargeScreen = width > getWidthBreakpoint();
	const filteredRoutes = routes.filter((el) => el.for == 'native' || el.for == 'both');

	return (
		<>
			{isLargeScreen ? (
				<div className={`flex-col ${isLargeScreen ? 'flex' : 'hidden'} bg-primary p-6 h-screen text-white justify-center items-center w-52 lg:w-56 xl:w-64 fixed`}>
					<Image source={images.logo} style={{ width: 80, height: 80 }} resizeMode="contain" />

					<div className="mt-10 flex flex-col gap-2 w-full">
						{routes
							.filter((el) => el.for === 'web' || el.for === 'both')
							.map(({ name, title, link, activeIcon, inactiveIcon, role }, index) => {
								const isActive = pathname === link || (link.includes('/admin') && pathname.includes('/admin'));

								if (role && role !== userRole) return null;

								return (
									<div key={name + index} onClick={() => onNavigate(link)} className={`flex gap-2 items-center cursor-pointer p-3 rounded-lg transition-all ${isActive ? 'bg-accent text-primary font-medium' : 'hover:bg-accent hover:text-primary hover:font-medium'}`}>
										<Image source={isActive ? activeIcon : inactiveIcon} style={{ width: 18, height: 18 }} resizeMode="contain" />
										<WebNavLink>{title}</WebNavLink>
									</div>
								);
							})}
					</div>

					<div className="mt-auto text-center flex items-center justify-center gap-3 cursor-pointer hover:bg-white hover:text-primary hover:font-medium w-full p-3 rounded-md" onClick={signOut}>
						<Image source={images.logoutIcon} style={{ width: 18, height: 18 }} resizeMode="contain" />
						<span>Log Out</span>
					</div>
				</div>
			) : (
				<>
					{filteredRoutes.length !== 0 && (
						<div style={{ ...sharedStyles.tabBar, position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 20 }}>
							{filteredRoutes.map(({ TabIcon, link, title }) => (
								<div onClick={() => onNavigate(link)}>{TabIcon && <TabIcon focused={false} isMobile={false} />}</div>
							))}
						</div>
					)}
				</>
			)}
		</>
	);
}
