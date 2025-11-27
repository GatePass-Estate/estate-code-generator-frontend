import { Platform } from 'react-native';
import EditSecurityProfileWeb from './index.web';

export default function EditSecurityProfile() {
	const Component = Platform.select({
		default: () => <EditSecurityProfileWeb />,
	});

	return <Component />;
}
