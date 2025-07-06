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
import { Link } from "expo-router";
import CheckBox from 'expo-checkbox';
import { Picker } from '@react-native-picker/picker';
import { NavigationProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Stack } from "expo-router";
import {
  FlatList,
  Pressable,
} from "react-native";


interface Guest {
  name: string;
  gender: string;
  relationship: string;
}

const AddGuest = ({ navigation }: { navigation: NavigationProp<any> }) => {
  const [guestName, setGuestName] = useState('');
  const [gender, setGender] = useState('');
  const [relationship, setRelationship] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [guestList, setGuestList] = useState<Guest[]>([]);

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

      navigation.navigate('MyGuest', { guestList: updatedGuestList });
    } else {
      Alert.alert(
        'Error',
        'Please fill out all fields and agree to add the guest.'
      );
    }
  };
  function SettingsIcon() {
    return (
      <Link href="/modal" asChild>
        <Pressable className="opacity-80">
          {({ pressed }) => (
            <View style={styles.profileCircle}>
              <Text style={styles.profileInitials}>GD</Text>
            </View>
          )}
        </Pressable>
      </Link>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen
              options={{
                headerShown: true,
                title: "Active Codes",
                headerRight: () => <SettingsIcon />,
                headerTitleStyle: {
                  color: "#113E55",
                  fontFamily: "UbuntuSans",
                  fontWeight: "bold",
                  height: 50,
                },
                headerStyle: {
                  elevation: 0,
                  shadowOpacity: 0,
                  borderBottomWidth: 0,
                },
              }}
            />
      <Text style={styles.subHeader}>Fill in your guest information</Text>

      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        placeholder='Enter Guest Name...'
        value={guestName}
        onChangeText={setGuestName}
      />

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

      <Text style={styles.label}>Relationship</Text>
      <TextInput
        style={styles.input}
        placeholder='Enter your relationship with guest'
        value={relationship}
        onChangeText={setRelationship}
      />


      <View style={styles.checkboxContainer}>
        <CheckBox
          value={isChecked}
          onValueChange={handleCheckboxChange}
        />
        <Text style={styles.checkboxText}>
          {isChecked ? 'Add to My Guest List' : 'Add to My Guest List'}
        </Text>
      </View>


      <TouchableOpacity style={styles.generateButton} onPress={() => router.push('/invitePage')}>
        <Text style={styles.buttonText}>Generate Code</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.saveButton} >
        <Text style={styles.saveText}>Save Guest</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default AddGuest;

const styles = StyleSheet.create({
  container: {
    marginTop: -15,
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
    color: 'gray',
    height: 52,
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
    left: 38,
    width: 250,
    backgroundColor: '#113E55',
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 55,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  profileCircle: {
    width: 35,
    height: 35,
    marginRight: 46,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#113E55",
    justifyContent: "center",
    alignItems: "center",
  },
  profileInitials: {
    color: "#113E55",
    fontWeight: "300",
    fontFamily: "UbuntuSans",
    fontSize: 23,
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
