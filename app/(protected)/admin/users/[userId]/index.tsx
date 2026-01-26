import { useWindowDimensions } from 'react-native';
import SingleUserMobile from './native';
import SingleUserWeb from './web';

const SingleUser = () => {
  const { width } = useWindowDimensions();
  return width >= 768 ? <SingleUserWeb /> : <SingleUserMobile />;
};

export default SingleUser;
