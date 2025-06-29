import React from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const guests = [
  { name: 'Sandra', relation: 'Friend', gender: 'female', color: '#FFEFEA' },
  { name: 'Jeff', relation: 'Service Provider', gender: 'male' },
  { name: 'Sandra', relation: 'Friend', gender: 'male' },
  { name: 'Ben', relation: 'Partner', gender: 'male' },
  { name: 'Maya', relation: 'Friend', gender: 'female' },
];

const MyGuest = () => {
  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#555" style={{ marginLeft: 8 }} />
        <TextInput placeholder="Search" style={styles.searchInput} />
      </View>

      <Text style={styles.savedLabel}>All Saved Guests</Text>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {guests.map((guest, index) => (
          <View key={index} style={[styles.card, guest.color ? { backgroundColor: guest.color } : {}]}>
            <View style={styles.guestInfo}>
              <Ionicons
                name={guest.gender === 'male' ? 'male' : 'female'}
                size={18}
                color={guest.gender === 'male' ? '#2980b9' : '#e74c3c'}
              />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.guestName}>{guest.name}</Text>
                <Text style={styles.guestRelation}>{guest.relation}</Text>
              </View>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity style={{ marginRight: 15 }}>
                <Ionicons name="trash-outline" size={20} color="#555" />
              </TouchableOpacity>
              <TouchableOpacity>
                <MaterialIcons name="qr-code" size={20} color="#555" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

    </View>
  );
};

export default MyGuest;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#113E55',
  },
  searchBar: {
    flexDirection: 'row',
    backgroundColor: '#F1F1F1',
    borderRadius: 8,
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  searchInput: {
    padding: 10,
    flex: 1,
    fontSize: 14,
  },
  savedLabel: {
    fontSize: 14,
    marginBottom: 10,
    color: '#222',
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F6F6F6',
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  guestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  guestName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
  },
  guestRelation: {
    fontSize: 13,
    color: '#777',
  },
  actions: {
    flexDirection: 'row',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    transform: [{ translateX: -30 }],
    backgroundColor: '#113E55',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
});
