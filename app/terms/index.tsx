import { Platform } from 'react-native';
import RedirectMobile from './index.native';
import TermsPage from './index.web';

export default Platform.select({
	web: TermsPage,
	default: RedirectMobile,
});
