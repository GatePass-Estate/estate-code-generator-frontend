import { Platform } from 'react-native';
import TwoFactorSetupMobile from './index.native';
import TwoFactorSetupWeb from './index.web';

export default Platform.select({
  web: TwoFactorSetupWeb,
  default: TwoFactorSetupMobile,
});
