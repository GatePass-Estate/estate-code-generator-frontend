import { Platform } from 'react-native';
import editRequestMobile from './index.native';
import editRequestWeb from './index.web';

export default Platform.select({
	web: editRequestWeb,
	default: editRequestMobile,
});
