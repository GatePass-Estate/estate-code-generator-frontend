import { Platform } from 'react-native';
import DurationMobile from './index.native';

export default Platform.select({
  default: DurationMobile,
});
