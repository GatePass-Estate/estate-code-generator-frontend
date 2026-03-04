import { Platform, useWindowDimensions } from 'react-native';
import EditRequest from './native';
import EditProfile from './web';

export default function Edit() {
	const Component = Platform.select({
		web: () => <EditProfile />,
		default: () => <EditRequest />,
	});

	const { width } = useWindowDimensions();
	const isLargeScreen = width > 768;

	return isLargeScreen ? <Component /> : <EditRequest />;
}
