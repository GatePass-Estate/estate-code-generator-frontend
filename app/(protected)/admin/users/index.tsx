import { Platform, useWindowDimensions } from 'react-native';
import AllUsersMobile from './native';
import AllUsersWeb from './web';

export default function Users() {
	const Component = Platform.select({
		web: () => <AllUsersWeb />,
		default: () => <AllUsersMobile />,
	});

	const { width } = useWindowDimensions();
	const isLargeScreen = width > 768;

	return isLargeScreen ? <Component /> : <AllUsersMobile />;
}
