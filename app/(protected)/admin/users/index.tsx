import { useWindowDimensions } from 'react-native';
import AllUsersMobile from './native';
import AllUsersWeb from './web';

const AllUsers = () => {
  const { width } = useWindowDimensions();
  return width >= 768 ? <AllUsersWeb /> : <AllUsersMobile />;
};

export default AllUsers;
