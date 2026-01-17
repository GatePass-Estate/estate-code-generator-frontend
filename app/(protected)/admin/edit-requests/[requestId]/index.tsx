import { Platform } from 'react-native';
import EditSingleRequestMobile from './index.native';
import EditSingleRequestWeb from './index.web';

export default Platform.select({
	web: EditSingleRequestWeb,
	default: EditSingleRequestMobile,
});
