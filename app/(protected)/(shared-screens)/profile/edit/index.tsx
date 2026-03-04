import { Platform } from 'react-native';
import EditProfileMobile from './index.native';
import EditProfileWeb from './index.web';

export default Platform.select({
	web: EditProfileWeb,
	default: EditProfileMobile,
});
