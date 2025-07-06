import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  name: string;
  address: string;
  date: string;
  time: string;
  code: string;
}

export default function InviteCard({ name, address, date, time, code }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.row}><Text style={styles.label}>Name :</Text> {name}</Text>
      <Text style={styles.row}><Text style={styles.label}>Address :</Text> {address}</Text>
      <Text style={styles.row}><Text style={styles.label}>Date :</Text> {date}</Text>
      <Text style={styles.row}><Text style={styles.label}>Time :</Text> {time}</Text>
      <Text style={styles.row}><Text style={styles.label}>Access code :</Text> {code}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '85%',
    marginBottom: 30,
    borderWidth: 0.2,
  },
  row: {
    fontSize: 13,
    marginBottom: 8,
    color: '#333',
    // textAlign: "right",
  },
  label: {
    fontWeight: 'bold',
    color: '#113E55',
    
  },
});
