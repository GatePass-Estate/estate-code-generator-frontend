import { useRouter } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const UserProfileScreen = () => {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>{'<  Back'}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>User Profile</Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Name :</Text>
          <Text style={styles.value}>Sandra Happiness</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Address :</Text>
          <Text style={styles.value}>
            Flat 1, 18A Olayinka Something Street, U3 Estate
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Email Address :</Text>
          <Text style={styles.value}>sandaroji@hmo.com</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Phone Number :</Text>
          <Text style={styles.value}>0902 443 422 3324</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.deactivateBtn}>
          <Text style={styles.buttonText}>Deactivate</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.adminBtn}>
          <Text style={styles.buttonText}>Make Admin</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default UserProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
  },
  back: {
    color: '#1F2937',
    fontSize: 16,
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 20,
  },
  card: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 30,
  },
  row: {
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  label: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 4,
  },
  value: {
    flex: 1,
    color: '#1F2937',
    fontSize: 15,
    fontWeight: '400',
    textAlign: 'right',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deactivateBtn: {
    flex: 1,
    backgroundColor: '#1B998B',
    paddingVertical: 14,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  adminBtn: {
    flex: 1,
    backgroundColor: '#113E55',
    paddingVertical: 14,
    borderRadius: 8,
    marginLeft: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
});
