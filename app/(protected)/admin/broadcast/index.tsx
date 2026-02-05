import { Platform } from 'react-native';
import broadcastMobile from './index.native';
import broadcastWeb from './index.web';

export default Platform.select({
	web: broadcastWeb,
	default: broadcastMobile,
});
