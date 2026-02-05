import { Platform } from 'react-native';
import AddUsersMobile from './index.native';
import AddUsersWeb from './index.web';

export default Platform.select({
	web: AddUsersWeb,
	default: AddUsersMobile,
});
