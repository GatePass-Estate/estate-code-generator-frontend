import { Platform } from 'react-native';
import adminMobile from './index.native';
import adminWeb from './index.web';

export default Platform.select({
	web: adminWeb,
	default: adminMobile,
});
