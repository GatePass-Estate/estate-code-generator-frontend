import { Platform, useWindowDimensions } from 'react-native';
import SecurityVerificationMobile from './native';
import SecurityVerificationWeb from './web';

export default function Security() {
	const Component = Platform.select({
		web: () => <SecurityVerificationWeb />,
		default: () => <SecurityVerificationMobile />,
	});

	const { width } = useWindowDimensions();
	const isLargeScreen = width > 768;

	return isLargeScreen ? <Component /> : <SecurityVerificationMobile />;
}
