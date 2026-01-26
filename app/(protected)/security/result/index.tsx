import { useWindowDimensions } from 'react-native';
import HomeMobile from './native';

const Home = () => {
	const { width } = useWindowDimensions();
	return width >= 768 ? <></> : <HomeMobile />;
};

export default Home;
