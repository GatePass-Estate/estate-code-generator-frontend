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
import React from 'react';
import { Stack } from 'expo-router';
import { Link } from 'expo-router';
import {  TouchableOpacity,  Pressable } from 'react-native';

import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  StyleSheet,
  // TouchableOpacity,
  // Image,
} from 'react-native';
// import { FontAwesome } from '@expo/vector-icons';

const guestData = [
  { name: 'Sandra', code: '765 3E2', count: 45 },
  { name: 'Sandra', code: '765 3E2', count: 30 },
  { name: 'Sandra', code: '765 3E2', count: 15 },
  { name: 'Sandra', code: '765 3E2', count: 0 },
];

// Circular badge
const CircleBadge = ({ count }: { count: number }) => {
  const color =
    count === 0 ? '#FBC9C9' : count < 20 ? '#FF6262' : '#5CB85C';

  return (
    <View style={[styles.circle, { borderColor: color }]}>
      <Text style={[styles.count, { color }]}>{count}</Text>
    </View>
  );
};

function SettingsIcon() {
  return (
    <Link href='/modal' asChild>
      <Pressable className='opacity-80'>
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
    title: 'Active Codes',
    headerRight: () => <SettingsIcon />, 
    headerStyle: {
      marginTop: 30,
      elevation: 0, // Android
      shadowOpacity: 0, // iOS
      borderBottomWidth: 0, // Optional: removes bottom border on iOS
    },// 👈 This is the custom header title
  }}
/>


      <Text style={styles.subText}>All incoming guest</Text>

      <FlatList
        data={guestData}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={styles.guestCard}>
            <View>
              <Text style={styles.guestName}>{item.name}</Text>
              <Text style={styles.guestCode}>{item.code}</Text>
            </View>
            <CircleBadge count={item.count} />
          </View>
        )}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBFEFF',
    paddingHorizontal: 20,
  },
  header: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#113E55',
  },
  profileCircle: {
    width: 35,
    height: 35,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#113E55',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    color: '#113E55',
    fontWeight: '600',
  },
  subText: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 40,
    color: '#113E55',
    marginVertical: 15,
  },
  guestCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 0.2, // 👈 Thin border
    borderColor: '#113E55',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 0,
  },
  guestName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5C5C5C',
    marginBottom: 5,
  },
  guestCode: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 5,
    color: '#E05930',
  },
  circle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  count: {
    fontSize: 14,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#CEE5ED',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FBFEFF',
  },
});

