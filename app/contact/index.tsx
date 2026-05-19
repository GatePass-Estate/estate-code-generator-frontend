import { Platform } from 'react-native';
import RedirectMobile from './index.native';
import ContactPage from './index.web';

export default Platform.select({
	web: ContactPage,
	default: RedirectMobile,
});
