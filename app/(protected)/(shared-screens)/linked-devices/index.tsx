import { Platform } from 'react-native';
import LinkedDevicesMobile from './index.native';
import LinkedDevicesWeb from './index.web';

export default Platform.select({
  web: LinkedDevicesWeb,
  default: LinkedDevicesMobile,
});
