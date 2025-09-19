import { useNavigation } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const Back = () => {
	const navigation = useNavigation();

	return (
		<TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
			<Icon name="arrow-back" size={20} color="#113E55" />
			<Text style={styles.backText}>Back</Text>
		</TouchableOpacity>
	);
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
		marginBottom: 50,
		marginLeft: -5,
	},

	backText: {
		color: '#113E55',
		fontSize: 16,
		marginLeft: 5,
		fontWeight: 'bold',
		fontFamily: 'UbuntuSans',
	},
});

export default Back;
