import { Platform } from 'react-native';
import InfoBoardMobile from './index.native';
import InfoBoardWeb from './index.web';

export default Platform.select({
  web: InfoBoardWeb,
  default: InfoBoardMobile,
});
