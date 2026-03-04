import { Platform, useWindowDimensions } from 'react-native';
import HomeMobile from './native';
import HomeWeb from './web';

export default function User() {
	const Component = Platform.select({
		web: () => <HomeWeb />,
		default: () => <HomeMobile />,
	});

	const { width } = useWindowDimensions();
	const isLargeScreen = width > 768;

	return isLargeScreen ? <Component /> : <HomeMobile />;
}
