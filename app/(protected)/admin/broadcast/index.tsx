import { Platform, useWindowDimensions } from 'react-native';
import SendBroadcast from './native';
import BroadcastWeb from './web';

export default function Broadcast() {
	const Component = Platform.select({
		web: () => <BroadcastWeb />,
		default: () => <SendBroadcast />,
	});

	const { width } = useWindowDimensions();
	const isLargeScreen = width > 768;

	return isLargeScreen ? <Component /> : <SendBroadcast />;
}
