import { Platform } from 'react-native';
import MyGuest from './native';

export default function Guests() {
	const Component = Platform.select({
		default: () => <MyGuest />,
	});

	return <Component />;
}
