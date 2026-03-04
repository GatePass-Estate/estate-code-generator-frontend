import { Platform } from 'react-native';
import InviteMobile from './index.native';
import InviteWeb from './index.web';

export default Platform.select({
	web: InviteWeb,
	default: InviteMobile,
});
