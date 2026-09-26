import { Platform } from 'react-native';
import AccessLogMobile from './index.native';

export default function AccessLog() {
  const Component = Platform.select({
    default: () => <AccessLogMobile />,
  });

  return <Component />;
}
