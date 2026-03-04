import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import CheckBox from 'expo-checkbox';
import { Stack, useRouter } from 'expo-router';
import UserIcon from '@/src/components/mobile/UserIcon';
import { generateCode } from '@/src/lib/api/codes';
import { useUserStore } from '@/src/lib/stores/userStore';
import { createGuest } from '@/src/lib/api/guests';
import { GenderType, RelationshipType } from '@/src/types/general';
import { sharedStyles } from '@/src/theme/styles';
import { timeCalc } from '@/src/lib/helpers';
import { Picker } from '@/src/components/mobile/Picker';

const AddGuestMobile = () => {
	const [guestName, setGuestName] = useState('');
	const [gender, setGender] = useState<GenderType>(null);
	const [relationship, setRelationship] = useState<RelationshipType>(null);
	const [isChecked, setIsChecked] = useState(false);
	const [error, setError] = useState('');
	const [running, setRunning] = useState<boolean>(false);

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

				let { formattedDate, timeframe } = timeCalc(result.valid_until);

				router.push({
					pathname: `/invite`,
					params: {
						code: result.hashed_code,
						name: guestName,
						address: `${useUserStore.getState().home_address}, ${useUserStore.getState().estate_name}.`,
						timeframe,
						date: formattedDate,
					},
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
					headerTitleAlign: 'left',
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
					<Picker
						label=""
						selectedValue={gender}
						onValueChange={(value) => setGender(value as GenderType)}
						placeholder="Select the gender of your guest"
						items={[
							{ label: 'Female', value: 'female' },
							{ label: 'Male', value: 'male' },
							{ label: "I'd prefer not to say", value: 'prefer_not_to_say' },
						]}
					/>
				</View>

				<View>
					<Text className="input-label">Relationship</Text>
					<Picker
						label=""
						selectedValue={relationship}
						onValueChange={(value) => setRelationship(value as RelationshipType)}
						placeholder="Select the relationship with your guest"
						items={[
							{ label: 'Partner', value: 'partner' },
							{ label: 'Friend', value: 'friend' },
							{ label: 'Family', value: 'family' },
							{ label: 'Taxi', value: 'taxi' },
							{ label: 'Delivery', value: 'delivery' },
							{ label: 'Technician', value: 'technician' },
							{ label: 'Other', value: 'other' },
						]}
					/>
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
					<Text className="text-white font-ubuntu-semibold text-md">Generate Code</Text>
				</TouchableOpacity>

				<TouchableOpacity onPress={handleSaveGuest} disabled={running} className="py-4 px-20">
					<Text className="text-primary text-[16px] font-ubuntu-medium">Save Guest </Text>
				</TouchableOpacity>
			</View>
		</ScrollView>
	);
};

export default AddGuestMobile;
