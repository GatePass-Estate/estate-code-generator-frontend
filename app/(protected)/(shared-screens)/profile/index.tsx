import { Platform } from 'react-native';
import ProfileMobile from './index.native';
import ProfileWeb from './index.web';

export default function Profile() {
	const Component = Platform.select({
		web: () => <ProfileWeb />,
		default: () => <ProfileMobile />,
	});

	return <Component />;
}
