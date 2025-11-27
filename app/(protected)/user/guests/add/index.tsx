import { Platform } from 'react-native';
import AddGuestMobile from './index.native';
import AddGuestWeb from './index.web';

export default Platform.select({
	web: AddGuestWeb,
	default: AddGuestMobile,
});
