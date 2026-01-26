import { useWindowDimensions } from 'react-native';
import EditRequestWeb from './web';
import EditRequestMobile from './native';

const editRequest = () => {
	const { width } = useWindowDimensions();
	return width >= 768 ? <EditRequestWeb /> : <EditRequestMobile />;
};

export default editRequest;
