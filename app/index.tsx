import { Platform } from 'react-native';
import IndexMobile from './index.native';
import IndexWeb from './index.web';

export default function Index() {
	const Component = Platform.select({
		web: () => <IndexWeb />,
		default: () => <IndexMobile />,
	});

	return <Component />;
}
