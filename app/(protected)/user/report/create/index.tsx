import { Platform } from 'react-native';
import IncidentReportCreateScreen from './index.native';

export default Platform.select({ default: IncidentReportCreateScreen });
