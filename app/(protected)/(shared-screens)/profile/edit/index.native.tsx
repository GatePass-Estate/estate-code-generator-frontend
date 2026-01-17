import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Back from '@/src/components/mobile/Back';
import { sharedStyles } from '@/src/theme/styles';

export default function EditRequest() {
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [address, setAddress] = useState('');
	const [phone, setPhone] = useState('');
	const [running, setRunning] = useState<boolean>(false);

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

			<Text style={sharedStyles.label}>Name</Text>
			<TextInput style={sharedStyles.input} placeholder="Enter your full name" value={name} onChangeText={setName} />

			<Text style={sharedStyles.label}>Email Address</Text>
			<TextInput style={sharedStyles.input} placeholder="Enter your email" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
			<Text style={sharedStyles.label}>Address</Text>
			<TextInput style={sharedStyles.input} placeholder="Enter your address" value={address} onChangeText={setAddress} />

			<Text style={sharedStyles.label}>Phone Number</Text>
			<TextInput style={sharedStyles.input} placeholder="Enter your phone number" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />

			<View className="items-center mt-12">
				<TouchableOpacity className={`px-24 bg-primary justify-center items-center py-5 font-UbuntuSans !rounded-xl ${running ? 'opacity-70' : ''}`} onPress={handleSendRequest}>
					<Text className="text-white font-semibold font-UbuntuSans text-md">Send Request</Text>
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	);
}
