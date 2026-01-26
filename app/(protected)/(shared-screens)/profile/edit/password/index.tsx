import { useWindowDimensions } from 'react-native';
import EditProfileMobile from './native';

const EditProfile = () => {
	const { width } = useWindowDimensions();
	return width >= 768 ? <></> : <EditProfileMobile />;
};

export default EditProfile;
