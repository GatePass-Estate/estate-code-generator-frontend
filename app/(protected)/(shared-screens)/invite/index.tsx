import { Platform, useWindowDimensions } from 'react-native';
import InvitePage from './native';
import ShareInvitePage from './web';

export default function Invite() {
	const Component = Platform.select({
		web: () => <ShareInvitePage />,
		default: () => <InvitePage />,
	});

	const { width } = useWindowDimensions();
	const isLargeScreen = width > 768;

	return isLargeScreen ? <Component /> : <InvitePage />;
}
