import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Back from '@/src/components/mobile/Back';
import { sharedStyles } from '@/src/theme/styles';

export default function EditRequest() {
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [address, setAddress] = useState('');
	const [phone, setPhone] = useState('');
	const [running, setRunning] = useState<boolean>(false);
	const navigation = useNavigation();

	const handleSendRequest = () => {
		if (name && email && address && phone) {
			Alert.alert('Request Sent', 'Your request has been submitted successfully.');
		} else {
			Alert.alert('Missing Fields', 'Please fill in all fields before submitting.');
		}
	};

	return (
		<SafeAreaView style={[sharedStyles.container, sharedStyles.modalContainer]}>
			{/* Back Button */}
			<Back type="short-arrow" />

			<Text className="text-grey mt-10 text-base font-Inter font-medium  ">Send a request to change your details</Text>

			<Text style={styles.label}>Name</Text>
			<TextInput style={styles.input} placeholder="Enter your full name" value={name} onChangeText={setName} />

			<Text style={styles.label}>Email Address</Text>
			<TextInput style={styles.input} placeholder="Enter your email" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />

			<Text style={styles.label}>Address</Text>
			<TextInput style={styles.input} placeholder="Enter your address" value={address} onChangeText={setAddress} />

			<Text style={styles.label}>Phone Number</Text>
			<TextInput style={styles.input} placeholder="Enter your phone number" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />

			<View style={styles.buttonGroup}>
				<TouchableOpacity className={`px-24 bg-primary justify-center items-center py-5 font-UbuntuSans !rounded-xl ${running ? 'opacity-70' : ''}`} onPress={handleSendRequest}>
					<Text className="text-white font-semibold font-UbuntuSans text-md">Send Request</Text>
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

	subHeader: {
		fontSize: 14,
		color: '#6b7280',
		marginTop: 40,
	},

	label: {
		fontSize: 12,
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
