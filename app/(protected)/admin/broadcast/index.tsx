import { useWindowDimensions } from 'react-native';
import BroadcastMobile from './native';
import BroadcastWeb from './web';

const broadcast = () => {
	const { width } = useWindowDimensions();
	return width >= 768 ? <BroadcastWeb /> : <BroadcastMobile />;
};

export default broadcast;
