import { useNavigation } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import images from '../constants/images';

const Back = ({ type = 'long-arrow' }: { type?: 'long-arrow' | 'short-arrow' }) => {
	const navigation = useNavigation();

	if (type === 'long-arrow')
		return (
			<TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
				<Icon name="arrow-back" size={20} color="#113E55" />
				<Text style={styles.backText}>Back</Text>
			</TouchableOpacity>
		);

	if (type === 'short-arrow')
		return (
			<TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
				<Image source={images.backImg} style={styles.backIcon} />
				<Text style={styles.backText}>Back</Text>
			</TouchableOpacity>
		);

	return null;
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
		paddingHorizontal: 20,
		paddingTop: 20,
	},

	backButton: {
		flexDirection: 'row',
		alignItems: 'center',
		marginLeft: -5,
	},

	backText: {
		color: '#113E55',
		fontSize: 16,
		marginLeft: 5,
		fontWeight: 'bold',
		fontFamily: 'UbuntuSans',
	},

	backIcon: {
		width: 25,
		height: 25,
		top: 1,
		resizeMode: 'contain',
	},
});

export default Back;
