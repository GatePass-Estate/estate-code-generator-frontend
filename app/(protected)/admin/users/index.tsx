import { Platform } from 'react-native';
import AllUsersMobile from './index.native';
import AllUsersWeb from './index.web';

export default Platform.select({
	web: AllUsersWeb,
	default: AllUsersMobile,
});
