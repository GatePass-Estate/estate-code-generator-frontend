import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Text } from '@/components/nativewindui/Text';
import { Link } from 'expo-router';
import { Tabs } from 'expo-router';
import { Image } from 'react-native';

const Tab = createBottomTabNavigator();

// Dummy Screen
const EmptyScreen = () => <View />;

// Custom Floating Button
const FloatingButton = ({ onPress }: any) => {
  return (
    <TouchableOpacity style={styles.fab} onPress={onPress}>
      <FontAwesome name='plus' size={15} color='#113E55' />
    </TouchableOpacity>
  );
};

// Header Right Icon
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

export default function UserTab() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#113E55',
        tabBarInactiveTintColor: '#888',
      }}>
      <Tabs.Screen
        name='(home)'
        options={{
          title: 'Home',
           headerShown: false,
          headerRight: () => <SettingsIcon />,
          tabBarIcon: ({ color }) => (
            <View>
              <Image
                source={require('@/assets/images/home.png')}
                style={{ width: 30, height: 30, resizeMode: 'contain', marginTop: 9 }}
              />
              <Text style={{ fontSize: 7, fontWeight: 'light', color: '#113E55' }}></Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name='(AddGuest)'
        options={{
          title: 'Active Codes',
          headerRight: () => <SettingsIcon />,
          headerShown: true,
          tabBarButton: (props) => <FloatingButton {...props} />,
        }}
      />
      <Tabs.Screen
        name='(MyGuest)'
        options={{
          title: 'My Guests',
          headerRight: () => <SettingsIcon />,
          tabBarIcon: ({ color }) => (
            <View style={{ alignItems: 'center' }}>
              <Image
                source={require('@/assets/icons/frame.png')}
                style={{ width: 30, height: 30, resizeMode: 'contain', marginTop: 9 }}
              />
              <Text style={{ fontSize: 7, fontWeight: '300', color: '#113E55' }}></Text>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    backgroundColor: '#CEE5ED',
    height: 70,
    bottom: 50,

    // Remove shadow (iOS and Android)
    elevation: 0, // Android
    shadowColor: 'transparent', // iOS
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    borderTopWidth: 0,
  },
  fab: {
    top: -40,
    right: -22,
    width: 70,
    height: 70,
    borderRadius: 50,
    backgroundColor: '#CEE5ED',
    borderColor: '#FBFEFF',
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',

    // Remove shadow
    elevation: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#113E55',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,

    // Remove shadow
    elevation: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  profileInitials: {
    color: '#113E55',
    fontWeight: '600',
  },
});
