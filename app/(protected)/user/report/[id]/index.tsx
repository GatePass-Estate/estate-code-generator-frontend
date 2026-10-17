import { Platform } from 'react-native';
import IncidentReportDetailScreen from './index.native';

export default Platform.select({
  default: IncidentReportDetailScreen,
});
