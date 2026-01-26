import { useWindowDimensions } from 'react-native';
import AddUsersMobile from './native';
import AddUsersWeb from './web';

const AddUsers = () => {
  const { width } = useWindowDimensions();
  return width >= 768 ? <AddUsersWeb /> : <AddUsersMobile />;
};

export default AddUsers;
