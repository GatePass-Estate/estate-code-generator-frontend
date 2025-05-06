import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { Text } from '@/components/nativewindui/Text';
import { Link } from 'expo-router';
import Icon from 'react-native-vector-icons/Ionicons';
import { Tabs } from 'expo-router';

const Tab = createBottomTabNavigator();

// Dummy Screens
const EmptyScreen = () => <View />; // Placeholder for floating button

// Custom Floating Button
const FloatingButton = ({ onPress }: any) => {
  return (
    <TouchableOpacity style={styles.fab} onPress={onPress}>
      <FontAwesome name='plus' size={15} color='#113E55' />
    </TouchableOpacity>
  );
};

// Header Right Icons
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
          headerRight: () => <SettingsIcon />,
          tabBarIcon: ({ color }) => (
            <View>
              <MaterialIcons name='home' size={35} color={color} />
              <Text style={{ fontSize: 7, fontWeight: 'light', color: '#113E55', }}></Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name='(AddGuest)'
        options={{
          title: 'Active Codes',
          headerShown: true,
          tabBarButton: (props) => <FloatingButton {...props} />,
        }}
      />
      <Tabs.Screen
        name='(MyGuest)'
        options={{
          title: 'My Guest',
          headerRight: () => <SettingsIcon />,
          tabBarIcon: ({ color }) => (
            <View>
              <MaterialIcons name='person' size={35} color={color} />
              <Text style={{ fontSize: 7, fontWeight: 'light', color: '#113E55' }}></Text>
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
  },
  profileInitials: {
    color: '#113E55',
    fontWeight: '600',
  }
});
