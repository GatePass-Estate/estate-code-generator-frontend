import { useWindowDimensions } from 'react-native';
import EditSingleRequestMobile from './native';

const EditSingleRequest = () => {
	const { width } = useWindowDimensions();
	return width >= 768 ? <></> : <EditSingleRequestMobile />;
};

export default EditSingleRequest;
