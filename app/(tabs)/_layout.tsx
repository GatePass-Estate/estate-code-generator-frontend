import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import HomeScreen from './HomeScreen';
import MyGuest from './MyGuest';
import { Text } from '@/components/nativewindui/Text';
import AddGuest from './AddGuest';
import { Link } from 'expo-router';
import Icon from 'react-native-vector-icons/Ionicons';

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
          <View style={{ opacity: pressed ? 0.5 : 0.9 }}>
            <Icon name='person' size={24} color='#113E55' />
          </View>
        )}
      </Pressable>
    </Link>
  );
}


export default function App() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#113E55',
        tabBarInactiveTintColor: '#888',
      }}>
      <Tab.Screen
        name='Home'
        component={HomeScreen}
        options={{
          title: 'Active Codes',
          headerRight: () => <SettingsIcon />,
          tabBarIcon: ({ color }) => (
            <View>
              <MaterialIcons name='home' size={35} color={color} />
              <Text style={{ fontSize: 7, fontWeight: 'light', color: '#113E55' }}></Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name='Add'
        component={AddGuest}
        options={{
          title: 'Active Codes',
          tabBarActiveTintColor: '#113E55',
          tabBarInactiveTintColor: '#888',
          headerShown: true, // Hide header for floating button
          tabBarButton: (props) => <FloatingButton {...props} />,
          
        }}
        
      />
      <Tab.Screen
        name='My Guest'
        component={MyGuest}
        options={{
          title: 'My Guest',
          headerRight: () => <SettingsIcon />, // Different headerRight for this screen
          tabBarIcon: ({ color }) => (
            <View>
              <MaterialIcons name='person' size={35} color={color} />
              <Text style={{ fontSize: 7, fontWeight: 'light', color: '#113E55' }}></Text>
            </View>
          ),
        }}
      />
    </Tab.Navigator>
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
});
