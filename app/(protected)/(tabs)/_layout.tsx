import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, TouchableOpacity, StyleSheet, Pressable, Image } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { Text } from "@/components/nativewindui/Text";
import { Link } from "expo-router";
import { Tabs } from "expo-router";
import { useAuth } from "@/hooks/useAuthContext"; // Import your auth context

const Tab = createBottomTabNavigator();

// Dummy Screen
const EmptyScreen = () => <View />;

// Floating Action Button
const FloatingButton = ({ onPress }: any) => {
  return (
    <TouchableOpacity style={styles.fab} onPress={onPress}>
      <FontAwesome name="plus" size={15} color="#113E55" />
    </TouchableOpacity>
  );
};

// Profile Icon with Initials
function SettingsIcon() {
  const { user } = useAuth();
  const initials =
    user?.first_name && user?.last_name
      ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
      : 'RT';
console.log("User from context:", user, "hello");

  return (
    <Link href="/modal" asChild>
      <Pressable className="opacity-80">
        <View style={styles.profileCircle}>
          <Text style={styles.profileInitials}>{initials}</Text>
        </View>
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
        tabBarActiveTintColor: "#113E55",
        tabBarInactiveTintColor: "#113E55",
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: "Home",
          headerShown: false,
          headerRight: () => <SettingsIcon />,
          tabBarIcon: ({ color, focused }) => (
            <View>
              <Image
                source={
                  focused
                    ? require("@/assets/images/active-button.png")
                    : require("@/assets/images/menu icon.png")
                }
                style={{
                  marginLeft: -3,
                  width: 30,
                  height: 25,
                  resizeMode: "contain",
                  marginTop: 9,
                }}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="(AddGuest)"
        options={{
          title: "Active Codes",
          headerRight: () => <SettingsIcon />,
          headerTitleStyle: {
            color: "#113E55",
            fontFamily: "UbuntuSans",
            fontWeight: "bold",
          },
          headerShown: false,
          tabBarButton: (props) => <FloatingButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="(MyGuest)"
        options={{
          title: "My Guests",
          headerShown: false,
          headerRight: () => <SettingsIcon />,
          headerTitleStyle: {
            color: "#113E55",
            fontFamily: "UbuntuSans",
            fontWeight: "bold",
          },
          tabBarIcon: ({ color }) => (
            <View style={{ alignItems: "center" }}>
              <Image
                source={require("@/assets/icons/Guest-icon.png")}
                style={{
                  width: 30,
                  height: 30,
                  resizeMode: "contain",
                  marginTop: 9,
                }}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    backgroundColor: "#CEE5ED",
    height: 70,
    bottom: 50,
    elevation: 0,
    shadowColor: "transparent",
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
    backgroundColor: "#CEE5ED",
    borderColor: "#FBFEFF",
    borderWidth: 4,
    justifyContent: "center",
    alignItems: "center",
    elevation: 0,
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#113E55",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
    elevation: 0,
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  profileInitials: {
    color: "#113E55",
    fontWeight: "300",
    fontFamily: "UbuntuSans",
    fontSize: 23,
  },
});
