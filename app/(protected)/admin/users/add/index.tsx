import { Platform, useWindowDimensions } from 'react-native';
import RegisterUser from './native';
import RegisterUserWeb from './web';

export default function Add() {
	const Component = Platform.select({
		web: () => <RegisterUserWeb />,
		default: () => <RegisterUser />,
	});

	const { width } = useWindowDimensions();
	const isLargeScreen = width > 768;

	return isLargeScreen ? <Component /> : <RegisterUser />;
}
