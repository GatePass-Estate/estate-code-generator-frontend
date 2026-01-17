import { Platform } from 'react-native';
import SingleUserMobile from './index.native';
import SingleUserWeb from './index.web';

export default Platform.select({
	web: SingleUserWeb,
	default: SingleUserMobile,
});
