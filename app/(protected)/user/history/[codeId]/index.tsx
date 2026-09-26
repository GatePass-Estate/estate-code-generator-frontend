import { Platform } from 'react-native';
import HistoryDetailMobile from './index.native';

export default Platform.select({
  default: HistoryDetailMobile,
});
