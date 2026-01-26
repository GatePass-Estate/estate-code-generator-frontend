import { useWindowDimensions } from 'react-native';
import AdminMobile from './native';
import AdminWeb from './web';

const Admin = () => {
	const { width } = useWindowDimensions();
	return width >= 768 ? <AdminWeb /> : <AdminMobile />;
};

export default Admin;
