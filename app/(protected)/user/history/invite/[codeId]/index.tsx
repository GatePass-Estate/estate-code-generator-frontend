import { Platform } from 'react-native';
import UpcomingInviteMobile from './index.native';

export default Platform.select({
  default: UpcomingInviteMobile,
});
