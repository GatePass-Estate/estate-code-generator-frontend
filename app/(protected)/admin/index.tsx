import { Platform, useWindowDimensions } from 'react-native';
import AdminUsersMobilePage from './native';
import AdminUsersPage from './web';

export default function Admin() {
	const Component = Platform.select({
		web: () => <AdminUsersPage />,
		default: () => <AdminUsersMobilePage />,
	});

	const { width } = useWindowDimensions();
	const isLargeScreen = width > 768;

	return isLargeScreen ? <Component /> : <AdminUsersMobilePage />;
}
