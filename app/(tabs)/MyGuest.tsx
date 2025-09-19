import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

const MyGuest = () => {
	const { name, gender, relationship } = useLocalSearchParams();

	return (
		<View style={styles.container}>
			<Text style={styles.header}>Guest Details</Text>
			<Text>Name: {name}</Text>
			<Text>Gender: {gender}</Text>
			<Text>Relationship: {relationship}</Text>
		</View>
	);
};

export default MyGuest;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
		backgroundColor: '#fff',
	},
	header: {
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 10,
	},
});
