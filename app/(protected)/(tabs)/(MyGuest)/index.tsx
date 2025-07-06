import React from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Stack } from "expo-router";
import { Link } from "expo-router";
import {
  FlatList,
  SafeAreaView,
  Pressable,
} from "react-native";


const guests = [
  { name: 'Sandra', relation: 'Friend', gender: 'female', color: '#FFEFEA' },
  { name: 'Jeff', relation: 'Service Provider', gender: 'male' },
  { name: 'Sandra', relation: 'Friend', gender: 'gender' },
  { name: 'Ben', relation: 'Partner', gender: 'male' },
  { name: 'Maya', relation: 'Friend', gender: 'female' },
];

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
const MyGuest = () => {
  return (
    <View style={styles.container}>
      <Stack.Screen
              options={{
                headerShown: true,
                title: "My Guests",
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
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#555" style={{ marginLeft: 8 }} />
        <TextInput placeholder="Search" style={styles.searchInput} />
      </View>

      <Text style={styles.savedLabel}>All Saved Guests</Text>
      <View style={styles.divider} />


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

              {/* QRcode beside the deleete button */}
              {/* <TouchableOpacity>
                <MaterialIcons name="qr-code" size={20} color="#555" />
              </TouchableOpacity> */}
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
    // flex: 1,
    // paddingTop: 50,
    // paddingHorizontal: 20,
    // backgroundColor: '#fff',
     flex: 1,
    backgroundColor: "#FBFEFF",
    paddingHorizontal: 20,
    paddingTop: 35,
     elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
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
  profileCircle: {
    width: 35,
    height: 35,
    borderRadius: 17,
    borderWidth: 1,
    marginRight: 30,
    borderColor: "#113E55",
    justifyContent: "center",
    alignItems: "center",
  },
  profileInitials: {
    color: "#113E55",
    fontWeight: "300",
    fontFamily: "UbuntuSans",
    fontSize: 23,
    // height: ,
  },
  searchInput: {
    padding: 10,
    flex: 1,
    fontSize: 14,
  },
  savedLabel: {
    fontSize: 14,
    marginTop: 20,
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
    height: 60,
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
 divider: {
  height: 0.5,
  backgroundColor: '#113E55', // match your theme
  marginTop: 4,
  marginBottom: 15,
  width: '100%',
}


});
