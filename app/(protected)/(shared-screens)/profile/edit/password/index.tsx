import { Platform } from 'react-native';
import EditProfileMobile from './index.native';

export default Platform.select({
	default: EditProfileMobile,
});
