import { Platform } from 'react-native';
import UsageLogMobile from './index.native';

export default function UsageLog() {
  if (Platform.OS === 'web') return null;
  return <UsageLogMobile />;
}
