import { Platform } from 'react-native';
import RedirectMobile from './index.native';
import PrivacyPage from './index.web';

export default Platform.select({
	web: PrivacyPage,
	default: RedirectMobile,
});
