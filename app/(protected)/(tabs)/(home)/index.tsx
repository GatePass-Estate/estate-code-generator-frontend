// import React from 'react';
// import { Stack } from 'expo-router';
// import { View, Text, Image } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';

// export default function HomeScreen() {
//   return (
//     <SafeAreaView
//       style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//       <View>
//         <Stack.Screen options={{ headerShown: false }} />
//         <Image
//           source={require('../../../../assets/images/Ghost.png')} // Ghost
//           style={{ width: 180, height: 180, left: 10, bottom: 50 }}
//           resizeMode='contain'
//         />
//         <Text
//           style={{
//             textAlign: 'center',
//             fontSize: 23,
//             fontWeight: 'light',
//             color: '#D3D3D3',
//             bottom: 50,
//           }}>
//   Click the ‘+’ to add {'\n'}your guest
//         </Text>
//       </View>
//     </SafeAreaView>
//   );
// }
import React from "react";
import { Stack } from "expo-router";
import { Link } from "expo-router";
import CountdownRing from "@/components/CountdownRing";
import { StatusBar, Platform } from 'react-native';



import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Pressable,
} from "react-native";

const guestData = [
  { name: "Sandra", code: "765 3E2", count: 45 },
  { name: "Sandra", code: "765 3E2", count: 30 },
  { name: "Sandra", code: "765 3E2", count: 15 },
  { name: "Sandra", code: "765 3E2", count: 60 },
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

export default function ActiveCodes() {
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Active Codes",
          fontFamily: "UbuntuSans",
          headerRight: () => <SettingsIcon />,
          headerTitleStyle: {
            color: "#113E55",
            fontFamily: "UbuntuSans",
            fontWeight: "700",
            // height: 510,
          },
          headerStyle: {
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
        }}
      />

      <Text style={styles.subText}>All incoming guests</Text>

      <FlatList
        data={guestData}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={styles.guestCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.guestName}>{item.name}</Text>
              <Text style={styles.guestCode}>{item.code}</Text>
            </View>
            <CountdownRing size={55} storageKey={`guest-${item.code}`} />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FBFEFF",
    paddingHorizontal: 20,
    paddingTop: 3,
     elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
    
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
  subText: {
    fontSize: 13,
    fontWeight: "bold",
    fontFamily: "UbuntuSans",
    marginTop: 40,
    marginBottom: 30,
    color: "#113E55",
    marginVertical: 15,
  },
  guestCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderWidth: 0.2,
    borderColor: "#113E55",
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
  },
  guestName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#5C5C5C",
    marginBottom: 5,
  },
  guestCode: {
    fontSize: 25,
    fontWeight: "600",
    letterSpacing: 5,
    color: "#E05930",
    fontFamily: 'UbuntuSans'
  },
});
