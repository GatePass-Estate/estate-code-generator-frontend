import { useWindowDimensions } from 'react-native';
import HomeMobile from './native';
import HomeWeb from './web';

const Home = () => {
	const { width } = useWindowDimensions();
	return width >= 768 ? <HomeWeb /> : <HomeMobile />;
};

export default Home;
