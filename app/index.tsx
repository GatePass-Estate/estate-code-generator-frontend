import { Platform } from 'react-native';
import LandingPageMobile from './index.native';
import LandingPageWeb from './index.web';

export default Platform.select({
	web: LandingPageWeb,
	default: LandingPageMobile,
});
