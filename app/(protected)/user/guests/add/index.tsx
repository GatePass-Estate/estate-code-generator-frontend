import { useWindowDimensions } from 'react-native';
import AddGuestMobile from './native';
import AddGuestWeb from './web';

const AddGuest = () => {
  const { width } = useWindowDimensions();
  return width >= 768 ? <AddGuestWeb /> : <AddGuestMobile />;
};

export default AddGuest;
