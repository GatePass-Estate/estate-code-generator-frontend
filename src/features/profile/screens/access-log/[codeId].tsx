import { Platform } from 'react-native';
import UsageLogMobile from './[codeId].native';

export default function UsageLog() {
  if (Platform.OS === 'web') return null;
  return <UsageLogMobile />;
}
