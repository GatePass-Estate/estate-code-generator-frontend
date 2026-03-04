import { Platform } from 'react-native';
import GuestsMobile from './index.native';
import GuestsWeb from './index.web';

export default Platform.select({
	web: GuestsWeb,
	default: GuestsMobile,
});
