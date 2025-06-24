import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function ValidationResult() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={20} color="#113E55" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity> */}

      <ScrollView contentContainerStyle={{ paddingBottom: 40, marginTop: 60 }}>
        <Text style={styles.label}>SECURITY CODE</Text>
        <Text style={styles.code}>765 3E2</Text>

        {/* Guest Details */}
          <Text style={styles.sectionTitle}>GUEST DETAILS</Text>
        <View style={styles.guestBox}>
          <View style={styles.infoRow}>
            <Text style={styles.labelText}>Name :</Text>
            <Text style={styles.valueText}>Sandy Happiness</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.labelText}>Gender :</Text>
            <Text style={styles.valueText}>Female</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.labelText}>Relationship :</Text>
            <Text style={styles.valueText}>Family</Text>
          </View>
        </View>

        {/* Resident Details */}
          <Text style={styles.sectionTitle2}>RESIDENT DETAILS</Text>
        <View style={styles.residentBox}>
          <View style={styles.infoRow}>
            <Text style={styles.labelText}>Name :</Text>
            <Text style={styles.valueText}>Sandra Happiness</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.labelText}>Address :</Text>
            <Text style={styles.valueText}>Flat 1, 18A Olayinka  Street, U3 Estate</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.labelText}>Email Address :</Text>
            <Text style={styles.valueText}>sandaronsh@hot.com</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.labelText}>Phone Number :</Text>
            <Text style={styles.valueText}>0907 345 289</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backText: {
    color: '#113E55',
    marginLeft: 5,
    fontWeight: '500',
  },
  label: {
    color: '#E76F51',
    textAlign: 'center',
    fontWeight: '600',
  },
  code: {
    fontSize: 42,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#113E55',
    marginVertical: 10,
  },
  guestBox: {
    backgroundColor: '#FFF4EF',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F8C8B4',
    marginBottom: 20,
  },
  residentBox: {
    backgroundColor: '#F4F9FB',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C9E4E1',
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 10,
    color: '#E76F51',
  },
  sectionTitle2: {
    fontWeight: '600',
    marginBottom: 10,
    color: '#113E55',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  labelText: {
    fontWeight: '500',
    width: 120,
    color: '#555',
  },
  valueText: {
    flex: 1,
     textAlign: 'right',
    fontWeight: '400',
    color: '#222',
  },
});
