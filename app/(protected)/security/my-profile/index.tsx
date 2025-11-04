import { Platform } from 'react-native';
import SecurityProfileWeb from './index.web';

export default function SecurityProfile() {
	const Component = Platform.select({
		default: () => <SecurityProfileWeb />,
	});

	return <Component />;
}
