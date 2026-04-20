import { Platform } from 'react-native';
import AccountSecurityMobile from './index.native';

export default Platform.select({
	default: AccountSecurityMobile,
});
