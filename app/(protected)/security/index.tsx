import { Platform } from 'react-native';
import SecurityVerificationMobile from './index.native';
import SecurityVerificationWeb from './index.web';

export default function Home() {
	const Component = Platform.select({
		web: () => <SecurityVerificationWeb />,
		default: () => <SecurityVerificationMobile />,
	});

	return <Component />;
}
