import { Platform, useWindowDimensions } from 'react-native';
import EditRequestMobile from './native';
import EditRequestsWeb from './web';

export default function EditRequests() {
	const Component = Platform.select({
		web: () => <EditRequestsWeb />,
		default: () => <EditRequestMobile />,
	});

	const { width } = useWindowDimensions();
	const isLargeScreen = width > 768;

	return isLargeScreen ? <Component /> : <EditRequestMobile />;
}
