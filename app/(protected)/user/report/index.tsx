import { Platform } from 'react-native';
import ReportMobile from './index.native';

export default Platform.select({
  default: ReportMobile,
});
