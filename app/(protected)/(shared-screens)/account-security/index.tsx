import { Platform } from 'react-native';
import AccountSecurityMobile from './index.native';
import AccountSecurityWeb from './index.web';

export default Platform.select({
	web: AccountSecurityWeb,
	default: AccountSecurityMobile,
});
