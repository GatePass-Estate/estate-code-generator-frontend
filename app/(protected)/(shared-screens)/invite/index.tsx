import { useWindowDimensions } from 'react-native';
import InviteMobile from './native';
import InviteWeb from './web';

const Invite = () => {
  const { width } = useWindowDimensions();
  return width >= 768 ? <InviteWeb /> : <InviteMobile />;
};

export default Invite;
