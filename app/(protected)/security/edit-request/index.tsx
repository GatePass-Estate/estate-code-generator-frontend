import { Platform } from 'react-native';
import SecurityEditRequestWeb from './index.web';

export default function SecurityEditRequest() {
	const Component = Platform.select({
		default: () => <SecurityEditRequestWeb />,
	});

	return <Component />;
}
