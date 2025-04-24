import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

interface Guest {
  name: string;
  gender: string;
  relationship: string;
}

import { NavigationProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuthContext';

const AddGuest = ({ navigation }: { navigation: NavigationProp<any> }) => {
  const [guestName, setGuestName] = useState('');
  const [gender, setGender] = useState('');
  const [relationship, setRelationship] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [guestList, setGuestList] = useState<Guest[]>([]);
  const { signOut } = useAuth();

  const handleCheckboxChange = () => {
    setIsChecked(!isChecked);
  };

  const handleAddGuest = () => {
    if (guestName && gender && relationship && isChecked) {
      const newGuest: Guest = { name: guestName, gender, relationship };
      const updatedGuestList = [...guestList, newGuest];
      setGuestList(updatedGuestList);
      setGuestName('');
      setGender('');
      setRelationship('');
      setIsChecked(false);
      Alert.alert(
        'Guest Added',
        `${guestName} has been added to the guest list.`
      );

      // Navigate to MyGuest and pass the guestList
      navigation.navigate('MyGuest', { guestList: updatedGuestList });
    } else {
      Alert.alert(
        'Error',
        'Please fill out all fields and agree to add the guest.'
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.subHeader}>Fill in your guest information</Text>

      {/* Name Input */}
      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        placeholder='Enter Guest Name...'
        value={guestName}
        onChangeText={setGuestName}
      />

      {/* Gender Dropdown */}
      <Text style={styles.label}>Gender</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={gender}
          onValueChange={(itemValue) => setGender(itemValue)}
          style={styles.picker}>
          <Picker.Item label='Select the gender of your guest' value='' />
          <Picker.Item label='Male' value='male' />
          <Picker.Item label='Female' value='female' />
          <Picker.Item label='Other' value='other' />
        </Picker>
      </View>

      {/* Relationship Input */}
      <Text style={styles.label}>Relationship</Text>
      <TextInput
        style={styles.input}
        placeholder='Enter your relationship with guest'
        value={relationship}
        onChangeText={setRelationship}
      />

      {/* Checkbox */}
      <View style={styles.checkboxContainer}>
        <Text style={styles.checkboxText} onPress={handleCheckboxChange}>
          {isChecked ? '✔️ Add to My Guest List' : '❌ Add to My Guest List'}
        </Text>
      </View>

      {/* Buttons */}
      <TouchableOpacity style={styles.generateButton} onPress={handleAddGuest}>
        <Text style={styles.buttonText}>Generate Code</Text>
      </TouchableOpacity>

      {/* <TouchableOpacity style={styles.saveButton} onPress={handleAddGuest}> */}
      <TouchableOpacity style={styles.saveButton} onPress={signOut}>
        <Text style={styles.saveText}>Save Guest</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default AddGuest;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    backgroundColor: '#fff',
    marginBottom: 70,
  },
  subHeader: {
    fontSize: 14,
    color: '#6b7280',
    marginVertical: 10,
  },
  label: {
    fontSize: 14,
    color: '#113E55',
    marginTop: 15,
  },
  input: {
    backgroundColor: '#F7F9F9',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 5,
  },
  pickerContainer: {
    backgroundColor: '#F7F9F9',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    marginTop: 5,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },
  checkboxText: {
    marginLeft: 8,
    color: '#113E55',
  },
  generateButton: {
    backgroundColor: '#113E55',
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 30,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  saveButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  saveText: {
    color: '#113E55',
    fontSize: 16,
    fontWeight: '500',
  },
});
