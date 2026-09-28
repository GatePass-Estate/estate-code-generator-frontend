import { Platform } from 'react-native';
import DeleteAccountMobile from './index.native';
import DeleteAccountWeb from './index.web';

export default Platform.select({
  web: DeleteAccountWeb,
  default: DeleteAccountMobile,
});
