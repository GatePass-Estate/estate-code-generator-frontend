import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import UserTypeModal from '@/components/selectUser';

const RegisterUserScreen = () => {
  const [userType, setUserType] = useState('');
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <SafeAreaView>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>{'< Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Register User</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder='Enter user name...'
            placeholderTextColor='#9CA3AF'
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder='Enter user email address'
            placeholderTextColor='#9CA3AF'
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder='Enter user phone number'
            placeholderTextColor='#9CA3AF'
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Create Password</Text>
          <TextInput
            style={styles.input}
            placeholder='Enter password for user'
            secureTextEntry
            placeholderTextColor='#9CA3AF'
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Save User As</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={userType}
              onValueChange={(itemValue) => setUserType(itemValue)}
              style={[
                styles.picker,
                { color: userType === '' ? '#9CA3AF' : '#1F2937' },
              ]}
              dropdownIconColor='#9CA3AF'>
              <Picker.Item label='Type of user' value='' />
              <Picker.Item label='Resident' value='resident' />
              <Picker.Item label='Admin' value='admin' />
            </Picker>
          </View>
        </View>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => setModalVisible(true)}>
          <Text style={styles.continueText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
      <UserTypeModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
};

export default RegisterUserScreen;

const styles = StyleSheet.create({
  container: {
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 30, // Add bottom padding for scroll comfort
    backgroundColor: '#fff',
  },
  back: {
    color: '#1F2937',
    fontSize: 16,
    marginBottom: 10,
    opacity: 0.6,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F9FAFB',
    padding: Platform.OS === 'ios' ? 14 : 10,
    borderRadius: 10,
    fontSize: 15,
    color: '#1F2937',
  },
  pickerContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  continueButton: {
    backgroundColor: '#113E55',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40, // Prevent last item from being hidden
  },
  continueText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
