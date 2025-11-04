import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Modal, Pressable, Platform } from 'react-native';
import CheckBox from 'expo-checkbox';
import { Picker } from '@react-native-picker/picker';
import { Stack, useRouter } from 'expo-router';
import UserIcon from '@/src/components/mobile/UserIcon';
import { generateCode } from '@/src/lib/api/codes';
import { useUserStore } from '@/src/lib/stores/userStore';
import { createGuest } from '@/src/lib/api/guests';
import { GenderType, RelationshipType } from '@/src/types/general';
import { sharedStyles } from '@/src/theme/styles';

const AddGuest = () => {
	const [guestName, setGuestName] = useState('');
	const [gender, setGender] = useState<GenderType>(null);
	const [relationship, setRelationship] = useState<RelationshipType>(null);
	const [isChecked, setIsChecked] = useState(false);
	const [error, setError] = useState('');
	const [running, setRunning] = useState<boolean>(false);
	const [isPickerVisible, setIsPickerVisible] = useState(false);
	const [isRelationshipPickerVisible, setIsRelationshipPickerVisible] = useState(false);
	const router = useRouter();

	const handleCheckboxChange = () => {
		setIsChecked(!isChecked);
	};

	const clearInput = () => {
		setGuestName('');
		setGender(null);
		setRelationship(null);
		setIsChecked(false);
	};

	const inputChecks = (): boolean => {
		if (guestName == '') {
			Alert.alert('Error', "Please enter the guest's name.");
			return false;
		}

		if (gender == null) {
			Alert.alert('Error', 'Please select a gender.');
			return false;
		}

		if (relationship == null) {
			Alert.alert('Error', 'Please select or enter a relationship.');
			return false;
		}

		return true;
	};

	async function handleGenerateCode() {
		if (inputChecks()) {
			setRunning(true);
			try {
				const result = await generateCode({
					user_id: useUserStore.getState().user_id,
					estate_id: useUserStore.getState().estate_id ?? '',
					visitor_fullname: guestName,
					relationship_with_resident: relationship,
					gender: gender,
				});

				if (isChecked) {
					await createGuest({
						resident_id: useUserStore.getState().user_id,
						guest_name: guestName,
						relationship: relationship,
						gender: gender,
					});
				}
				setRunning(false);

				clearInput();
				router.push({
					pathname: `/invite`,
					params: { code: result.hashed_code, name: guestName, address: `${useUserStore.getState().home_address}, ${useUserStore.getState().estate_name}.` },
				});
			} catch (error) {
				setError('Failed to generate code. Please try again.');
			} finally {
				setRunning(false);
			}
		}
	}

	async function handleSaveGuest() {
		if (inputChecks()) {
			setRunning(true);
			try {
				await createGuest({
					resident_id: useUserStore.getState().user_id,
					guest_name: guestName,
					relationship: relationship,
					gender: gender,
				});

				clearInput();

				router.push({
					pathname: '/user/guests',
					params: {
						refresh: 'true',
					},
				});
			} catch (error) {
				setError('Failed to generate code. Please try again.');
			} finally {
				setRunning(false);
			}
		}
	}

	return (
		<ScrollView style={sharedStyles.container}>
			<Stack.Screen
				options={{
					headerShown: true,
					title: 'Add Guest',
					headerShadowVisible: false,
					headerStyle: sharedStyles.header,
					headerTitleStyle: sharedStyles.title,
					headerRight: () => <UserIcon />,
				}}
			/>

			<Text className="text-base text-grey mt-8 my-3">Fill in your guest information</Text>

			<View style={{ gap: 10 }}>
				<View>
					<Text className="input-label">Name</Text>
					<TextInput className="input-style" placeholder="Enter Guest Name..." value={guestName} onChangeText={setGuestName} />
				</View>

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
											<Picker.Item label="I'd prefer not to say" value="prefer_not_to_say" />
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
								<Picker.Item label="I'd prefer not to say" value="prefer_not_to_say" />
							</Picker>
						</View>
					)}
				</View>

				<View>
					<Text className="input-label">Relationship</Text>
					{Platform.OS === 'ios' ? (
						<>
							<Pressable className="input-style" onPress={() => setIsRelationshipPickerVisible(true)}>
								<Text style={{ color: relationship ? '#000' : '#9CA3AF' }}>{relationship || 'Select the relationship with your guest'}</Text>
							</Pressable>
							<Modal transparent={true} visible={isRelationshipPickerVisible} animationType="slide" onRequestClose={() => setIsRelationshipPickerVisible(false)}>
								<Pressable style={styles.modalOverlay} onPress={() => setIsRelationshipPickerVisible(false)}>
									<View className="bg-gray-800">
										<Picker selectedValue={relationship} onValueChange={(itemValue) => setRelationship(itemValue)} className="text-gray-300 h-14 w-full">
											<Picker.Item label="Select the relationship with your guest" value="" enabled={false} />
											<Picker.Item label="Spouse" value="spouse" />
											<Picker.Item label="Friends" value="male" />
											<Picker.Item label="Family" value="family" />
											<Picker.Item label="Taxi" value="taxi" />
											<Picker.Item label="Delivery" value="delivery" />
											<Picker.Item label="Technician" value="technician" />
											<Picker.Item label="Other" value="other" />
										</Picker>
									</View>
								</Pressable>
							</Modal>
						</>
					) : (
						<View className="bg-light-grey border-input-border rounded-lg mt-1">
							<Picker selectedValue={relationship} onValueChange={(itemValue) => setRelationship(itemValue)} className="text-gray-300 h-14 w-full text-sm" style={{ color: 'gray' }}>
								<Picker.Item label="Select the relationship with your guest" value="" enabled={false} />
								<Picker.Item label="Spouse" value="partner" />
								<Picker.Item label="Friend" value="friend" />
								<Picker.Item label="Family" value="family" />
								<Picker.Item label="Taxi" value="taxi" />
								<Picker.Item label="Delivery" value="delivery" />
								<Picker.Item label="Technician" value="technician" />
								<Picker.Item label="Other" value="other" />
							</Picker>
						</View>
					)}
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

			<View className="mt-14 items-center gap-2">
				<TouchableOpacity className={`px-20 bg-primary justify-center items-center py-4 font-UbuntuSans !rounded-md ${running ? 'opacity-70' : ''}`} onPress={handleGenerateCode} disabled={running}>
					<Text className="text-white font-semibold font-UbuntuSans text-md">Generate Code</Text>
				</TouchableOpacity>

				<TouchableOpacity onPress={handleSaveGuest} disabled={running} className="py-4 px-20">
					<Text className="text-primary text-[16px] ">Save Guest </Text>
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
