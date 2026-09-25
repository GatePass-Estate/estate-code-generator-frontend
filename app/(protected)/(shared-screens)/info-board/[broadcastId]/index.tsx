import { Platform } from 'react-native';
import BroadcastDetailMobile from './index.native';
import BroadcastDetailWeb from './index.web';

export default Platform.select({
  web: BroadcastDetailWeb,
  default: BroadcastDetailMobile,
});
