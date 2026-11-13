import { Platform } from 'react-native';
import AccessLogMobile from './index.native';

export default function AccessLog() {
  if (Platform.OS === 'web') return null;
  return <AccessLogMobile />;
}
