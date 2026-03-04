import { Platform } from 'react-native';
import SingleUserMobile from './native';

export default Platform.select({
	default: SingleUserMobile,
});
