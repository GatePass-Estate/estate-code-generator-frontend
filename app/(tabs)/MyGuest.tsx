import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MyGuest = ({ route }) => {
  const { MyGuest } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Guest Details</Text>
      <Text>Name: {guest.name}</Text>
      <Text>Gender: {guest.gender}</Text>
      <Text>Relationship: {guest.relationship}</Text>
    </View>
  );
};

export default MyGuest;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});
