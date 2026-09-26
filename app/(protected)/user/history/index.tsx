import { Platform } from 'react-native';
import HistoryMobile from './index.native';

export default Platform.select({
  default: HistoryMobile,
});
