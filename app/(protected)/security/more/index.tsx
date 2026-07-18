import { Platform } from 'react-native';
import SecurityMoreMobile from './index.native';

export default function SecurityMore() {
  const Component = Platform.select({
    default: () => <SecurityMoreMobile />,
  });

  return <Component />;
}
