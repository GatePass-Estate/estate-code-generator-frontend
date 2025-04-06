import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

const ProfileScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Icon name="arrow-back" size={20} color="#113E55" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      {/* Profile Title */}
      <Text style={styles.title}>My Profile</Text>

      {/* Personal Details Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          PERSONAL DETAILS
          <TouchableOpacity style={styles.editIcon}>
            <Icon name="pencil" size={16} color="#113E55" />
          </TouchableOpacity>
        </Text>

        {/* Profile Card */}
        <View style={styles.card}>
          <ProfileDetail label="Name" value="Sandra Happiness" />
          <ProfileDetail label="Address" value="Flat 1, 18A Olayinka Something Street, U3 Estate" />
          <ProfileDetail label="Email Address" value="sandaroJ@hmo.com" />
          <ProfileDetail label="Phone Number" value="0902 443 422 3324" />
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
};

// Reusable Component for Profile Details
const ProfileDetail = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label} :</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  backText: {
    color: '#113E55',
    fontSize: 16,
    marginLeft: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#113E55',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#113E55',
    marginBottom: 10,
    flexDirection: 'row',
  },
  editIcon: {
    marginLeft: 5,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailLabel: {
    color: '#888',
    fontSize: 14,
    fontWeight: 'bold',
  },
  detailValue: {
    color: '#113E55',
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    alignSelf: 'center',
    marginTop: 30,
  },
  logoutText: {
    color: '#E63946',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
