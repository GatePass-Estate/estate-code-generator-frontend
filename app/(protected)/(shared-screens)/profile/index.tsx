import { useWindowDimensions } from 'react-native';
import ProfileMobile from './native';
import ProfileWeb from './web';

const Profile = () => {
  const { width } = useWindowDimensions();
  return width >= 768 ? <ProfileWeb /> : <ProfileMobile />;
};

export default Profile;
