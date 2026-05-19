import { Platform } from 'react-native';
import RedirectMobile from './index.native';
import AboutPage from './index.web';

export default Platform.select({
	web: AboutPage,
	default: RedirectMobile,
});
