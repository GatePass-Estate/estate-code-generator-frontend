import { Platform, useWindowDimensions } from 'react-native';
import ProfileScreen from './native';
import MyProfile from './web';

export default function Profile() {
	const Component = Platform.select({
		web: () => <MyProfile />,
		default: () => <ProfileScreen />,
	});

	const { width } = useWindowDimensions();
	const isLargeScreen = width > 768;

	return isLargeScreen ? <Component /> : <ProfileScreen />;
}
