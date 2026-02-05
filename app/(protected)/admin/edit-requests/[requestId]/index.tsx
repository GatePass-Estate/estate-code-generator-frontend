import { Platform } from 'react-native';
import EditSingleRequestMobile from './index.native';

export default Platform.select({
	default: EditSingleRequestMobile,
});
