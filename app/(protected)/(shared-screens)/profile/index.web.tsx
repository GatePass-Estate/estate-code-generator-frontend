import WebSidebar from '@/src/components/web/WebSidebar';
import { useRouter } from 'expo-router';
import { menuRoutes } from '../../user/_layout';

const Index = () => {
	const router = useRouter();

	return (
		<div className="flex h-full w-screen overflow-y-scroll bg-body ">
			<WebSidebar routes={menuRoutes.filter((el) => el.for == 'web' || el.for == 'both').map(({ name, title, link, activeIcon, inactiveIcon }) => ({ name, title, link, activeIcon, inactiveIcon }))} onNavigate={(route) => router.push(route as any)} />

			<div className="web-body"></div>
		</div>
	);
};

export default Index;
