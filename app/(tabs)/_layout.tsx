import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import HomeScreen from './HomeScreen';
import MyGuest from './MyGuest';
import { Text } from '@/components/nativewindui/Text';

const Tab = createBottomTabNavigator();

// Dummy Screens

const EmptyScreen = () => <View />; // Placeholder for floating button

// Custom Floating Button
const FloatingButton = ({ onPress }: any) => {
  return (
    <TouchableOpacity style={styles.fab} onPress={onPress}>
      <FontAwesome name='plus' size={24} color='white' />
    </TouchableOpacity>
  );
};

export default function App() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: '#888',
        headerShown: false,
      }}>
      <Tab.Screen
        name='Home'
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <View>
              <MaterialIcons name='home' size={24} color={color} />
              <Text>Home</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name='Add'
        component={EmptyScreen}
        options={{
          tabBarButton: (props) => <FloatingButton {...props} />,
        }}
      />
      <Tab.Screen
        name='My Guests'
        component={MyGuest}
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialIcons name='person' size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    backgroundColor: '#E0E7EC',
    height: 60,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  fab: {
    top: -30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});
