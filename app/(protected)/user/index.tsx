import { Platform } from 'react-native';
import HomeMobile from './index.native';
import HomeWeb from './index.web';

export default function Home() {
	const Component = Platform.select({
		web: () => <HomeWeb />,
		default: () => <HomeMobile />,
	});

	return <Component />;
}
