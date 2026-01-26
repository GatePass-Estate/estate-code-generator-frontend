import { useWindowDimensions } from 'react-native';
import EditProfileMobile from './native';
import EditProfileWeb from './web';

const EditProfile = () => {
  const { width } = useWindowDimensions();
  return width >= 768 ? <EditProfileWeb /> : <EditProfileMobile />;
};

export default EditProfile;
