import { Platform } from 'react-native';
import RecoveryCodesMobile from './index.native';
import RecoveryCodesWeb from './index.web';

export default Platform.select({
  web: RecoveryCodesWeb,
  default: RecoveryCodesMobile,
});
