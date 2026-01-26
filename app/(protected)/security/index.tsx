import { useWindowDimensions } from 'react-native';
import SecurityVerificationMobile from './native';
import SecurityVerificationWeb from './web';

const SecurityVerification = () => {
  const { width } = useWindowDimensions();
  return width >= 768 ? <SecurityVerificationWeb /> : <SecurityVerificationMobile />;
};

export default SecurityVerification;
