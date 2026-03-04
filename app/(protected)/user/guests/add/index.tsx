import { Platform, useWindowDimensions } from 'react-native';
import AddGuestMobile from './native';
import AddGuestWeb from './web';

export default function Add() {
	const Component = Platform.select({
		web: () => <AddGuestWeb />,
		default: () => <AddGuestMobile />,
	});

	const { width } = useWindowDimensions();
	const isLargeScreen = width > 768;

	return isLargeScreen ? <Component /> : <AddGuestMobile />;
}
