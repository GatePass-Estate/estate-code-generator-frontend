import { Platform } from 'react-native';
import GuestsMobile from './native';

export default Platform.select({
	default: GuestsMobile,
});
