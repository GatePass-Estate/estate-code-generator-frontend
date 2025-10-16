import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Modal, Pressable, Platform } from 'react-native';
import CheckBox from 'expo-checkbox';
import { Picker } from '@react-native-picker/picker';
import { Stack, useRouter } from 'expo-router';
import UserIcon from '@/src/components/mobile/UserIcon';

interface Guest {
	name: string;
	gender: string;
	relationship: string;
}

const AddGuest = () => {
	const [guestName, setGuestName] = useState('');
	const [gender, setGender] = useState('');
	const [relationship, setRelationship] = useState('');
	const [isChecked, setIsChecked] = useState(false);
	const [isPickerVisible, setIsPickerVisible] = useState(false);
	const router = useRouter();

	const handleCheckboxChange = () => {
		setIsChecked(!isChecked);
	};

	const generateCode = async () => {
		if (guestName && gender && relationship && isChecked) {
			const newGuest: Guest = { name: guestName, gender, relationship };
			Alert.alert('Guest Added', `${guestName} has been added to the guest list.`);
			router.push('/user/guests');
		} else {
			Alert.alert('Error', 'Please fill out all fields and agree to add the guest.');
		}
	};

	return (
		<ScrollView className="container">
			<Stack.Screen
				options={{
					headerShown: true,
					title: 'Add Guest',
					headerStyle: {
						backgroundColor: '#FBFEFF',
					},
					headerShadowVisible: false,
					headerRight: () => <UserIcon />,
					headerTitleStyle: {
						color: '#113E55',
						fontFamily: 'UbuntuSans',
						fontWeight: '700',
					},
				}}
			/>

			<Text className="text-md text-gray-700 mt-10 my-3">Fill in your guest information</Text>

			<View style={{ gap: 10 }}>
				<View>
					<Text className="input-label">Name</Text>
					<TextInput className="input-style" placeholder="Enter Guest Name..." value={guestName} onChangeText={setGuestName} />
				</View>

				{isChecked && (
					<View>
						<Text className="input-label">Gender</Text>
						{Platform.OS === 'ios' ? (
							<>
								<Pressable className="input-style" onPress={() => setIsPickerVisible(true)}>
									<Text style={{ color: gender ? '#000' : '#9CA3AF' }}>{gender || 'Select the gender of your guest'}</Text>
								</Pressable>
								<Modal transparent={true} visible={isPickerVisible} animationType="slide" onRequestClose={() => setIsPickerVisible(false)}>
									<Pressable style={styles.modalOverlay} onPress={() => setIsPickerVisible(false)}>
										<View className="bg-gray-800">
											<Picker selectedValue={gender} onValueChange={(itemValue) => setGender(itemValue)} className="text-gray-300 h-14 w-full" style={{ color: 'red' }}>
												<Picker.Item label="Select the gender of your guest" value="" enabled={false} />
												<Picker.Item label="Female" value="female" />
												<Picker.Item label="Male" value="male" style={{ color: 'red' }} />
												<Picker.Item label="I'd prefer not to say" value="I'd prefer not to say" />
											</Picker>
										</View>
									</Pressable>
								</Modal>
							</>
						) : (
							<View className="bg-light-grey border-input-border rounded-lg mt-1">
								<Picker selectedValue={gender} onValueChange={(itemValue) => setGender(itemValue)} className="text-gray-300 h-14 w-full text-sm" style={{ color: 'gray' }}>
									<Picker.Item label="Select the gender of your guest" value="" enabled={false} />
									<Picker.Item label="Female" value="female" />
									<Picker.Item label="Male" value="male" />
									<Picker.Item label="I'd prefer not to say" value="I'd prefer not to say" />
								</Picker>
							</View>
						)}
					</View>
				)}

				<View>
					<Text className="input-label">Relationship</Text>
					<TextInput className="input-style" placeholder="Enter your relationship with guest" value={relationship} onChangeText={setRelationship} />
				</View>

				<View>
					<View className="flex-row items-center mt-4">
						<CheckBox value={isChecked} onValueChange={handleCheckboxChange} />
						<Text className="text-dark-teal p-2" onPress={handleCheckboxChange}>
							Add to My Guest List
						</Text>
					</View>
				</View>
			</View>

			<View className="mt-14 items-center">
				<TouchableOpacity className="w-64 bg-primary justify-center items-center py-4 font-UbuntuSans rounded-lg" onPress={generateCode}>
					<Text className="text-white font-semibold font-UbuntuSans text-md">Generate Code</Text>
				</TouchableOpacity>
			</View>
		</ScrollView>
	);
};

export default AddGuest;

const styles = StyleSheet.create({
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'flex-end',
	},
});
