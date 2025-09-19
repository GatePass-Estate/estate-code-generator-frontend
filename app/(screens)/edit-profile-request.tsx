import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { useNavigation } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditRequest() {
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [address, setAddress] = useState('');
	const [phone, setPhone] = useState('');
	const navigation = useNavigation();

	const handleSendRequest = () => {
		if (name && email && address && phone) {
			Alert.alert('Request Sent', 'Your request has been submitted successfully.');
		} else {
			Alert.alert('Missing Fields', 'Please fill in all fields before submitting.');
		}
	};

	return (
		<SafeAreaView style={styles.container}>
			{/* Back Button */}
			<TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
				<Image
					source={require('@/assets/icons/keyboard_arrow_left (1).png')} // update path if needed
					style={styles.backIcon}
				/>
				<Text style={styles.backText}>Back</Text>
			</TouchableOpacity>

			<Text style={styles.subHeader}>Send a request to change your details</Text>

			<Text style={styles.label}>Name</Text>
			<TextInput style={styles.input} placeholder="Enter your full name" value={name} onChangeText={setName} />

			<Text style={styles.label}>Email Address</Text>
			<TextInput style={styles.input} placeholder="Enter your email" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />

			<Text style={styles.label}>Address</Text>
			<TextInput style={styles.input} placeholder="Enter your address" value={address} onChangeText={setAddress} />

			<Text style={styles.label}>Phone Number</Text>
			<TextInput style={styles.input} placeholder="Enter your phone number" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />

			<View style={styles.buttonGroup}>
				<TouchableOpacity style={styles.submitButton} onPress={handleSendRequest}>
					<Text style={styles.submitText}>Send Request</Text>
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FBFEFF',
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
		fontWeight: 'semibold',
		fontSize: 18,
		marginLeft: 5,
		top: 0.5,
		fontFamily: 'UbuntuSans',
	},

	backIcon: {
		width: 25,
		height: 25,
		top: 1,
		resizeMode: 'contain',
	},

	subHeader: {
		fontSize: 14,
		color: '#6b7280',
		marginTop: 40,
	},

	label: {
		fontSize: 14,
		color: '#113E55',
		marginTop: 20,
	},

	input: {
		backgroundColor: '#F7F9F9',
		borderRadius: 8,
		paddingHorizontal: 16,
		paddingVertical: 12,
		marginTop: 5,
		height: 50,
	},

	buttonGroup: {
		alignItems: 'center',
		marginTop: 50,
	},

	submitButton: {
		width: 250,
		backgroundColor: '#113E55',
		paddingVertical: 15,
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
	},

	submitText: {
		color: '#fff',
		fontWeight: '600',
		fontFamily: 'UbuntuSans',
	},
});
