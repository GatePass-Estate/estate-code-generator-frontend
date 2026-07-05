import { Platform } from 'react-native';
import AccessLogDetailMobile from './index.native';

export default function AccessLogDetail() {
  const Component = Platform.select({
    default: () => <AccessLogDetailMobile />,
  });

  return <Component />;
}
