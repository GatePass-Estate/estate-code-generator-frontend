import { Platform } from 'react-native';
import HomeMobile from './index.native';

export default function Home() {
	const Component = Platform.select({
		default: () => <HomeMobile />,
	});

	return <Component />;
}
