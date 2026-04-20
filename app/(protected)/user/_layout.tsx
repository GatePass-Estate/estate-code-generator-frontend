import { View, Text, Platform } from "react-native";
import { Image } from "react-native";
import icons from "@/src/constants/icons";
import NavigationContainer from "@/src/components/common/NavigationContainer";
import { sharedStyles } from "@/src/theme/styles";
import { menuRouteType } from "@/src/types/general";

export const FloatingButton: React.FC<{
  focused?: boolean;
  isMobile?: boolean;
}> = ({ focused = false, isMobile = true }) => {
  return (
    <View
      style={[
        sharedStyles.fab,
        !focused
          ? { backgroundColor: "#CEE5ED" }
          : { backgroundColor: "#113E55" },
      ]}
    >
      <Image
        source={focused ? icons.plusActive : icons.plus}
        style={{
          marginLeft: -3,
          width: 15,
          height: 15,
          resizeMode: "contain",
        }}
      />
    </View>
  );
};

export const HomeIcon: React.FC<{ focused?: boolean; isMobile?: boolean }> = ({
  focused = false,
  isMobile = true,
}) => {
  return (
    <View className={`items-center mt-6 gap-1 ${isMobile ? "w-80" : "w-full"}`}>
      <Image
        source={
          focused
            ? Platform.OS == "ios"
              ? icons.iosHomeActive
              : icons.activeBtnImg
            : Platform.OS == "ios"
              ? icons.iosHomeInActive
              : icons.menuIcon
        }
        style={{
          marginLeft: -3,
          width: 20,
          height: 20,
          resizeMode: "contain",
        }}
      />
      <Text
        style={{
          fontSize: 12,
          fontWeight: focused ? 700 : 500,
          color: "#113E55",
        }}
      >
        Home
      </Text>
    </View>
  );
};

export const GuestIcon: React.FC<{ focused?: boolean; isMobile?: boolean }> = ({
  focused = false,
  isMobile = true,
}) => {
  return (
    <View className={`items-center mt-6 gap-1 ${isMobile ? "w-80" : "w-full"}`}>
      <Image
        source={
          focused
            ? Platform.OS == "ios"
              ? icons.iosGuestActive
              : icons.activeGuestIcon
            : Platform.OS == "ios"
              ? icons.iosGuestInActive
              : icons.inactiveGuestIcon
        }
        style={{
          width: 20,
          height: 20,
          resizeMode: "contain",
        }}
      />
      <Text
        style={{
          fontSize: 12,
          fontWeight: focused ? 700 : 500,
          color: "#113E55",
        }}
      >
        My Guests{" "}
      </Text>
    </View>
  );
};

export const menuRoutes: menuRouteType[] = [
  {
    name: "index",
    link: "/user",
    title: "Home",
    TabIcon: HomeIcon,
    for: "native",
    activeIcon: icons.activeHomeIcon,
    inactiveIcon: icons.inactiveHomeIcon,
  },

  {
    name: "index",
    link: "/user",
    title: "Home",
    TabIcon: HomeIcon,
    for: "web",
    activeIcon: icons.webHomeActiveIcon,
    inactiveIcon: icons.webHomeInActiveIcon,
  },

  {
    name: "guests/add/index",
    link: "/user/guests/add",
    title: "Add Guest",
    TabIcon: FloatingButton,
    for: "native",
  },

  {
    name: "guests/add/index",
    link: "/user/guests/add",
    title: "Generate Code",
    TabIcon: FloatingButton,
    for: "web",
    activeIcon: icons.activeCodeIcon,
    inactiveIcon: icons.inactiveCodeIcon,
  },

  {
    name: "guests/index",
    link: "/user/guests",
    title: "My Guests",
    TabIcon: GuestIcon,
    for: "native",
  },

  {
    name: "settings/index",
    link: "/settings",
    title: "Settings",
    TabIcon: GuestIcon,
    for: "web",
    activeIcon: icons.activeProfileIcon,
    inactiveIcon: icons.inactiveProfileIcon,
  },

  {
    name: "admin/index",
    link: "/admin",
    title: "Admin Access",
    for: "web",
    activeIcon: icons.activeAdminIcon,
    inactiveIcon: icons.inactiveAdminIcon,
    role: "admin",
  },

  {
    name: "admin/index",
    link: "/admin",
    title: "Admin Access",
    for: "web",
    activeIcon: icons.activeAdminIcon,
    inactiveIcon: icons.inactiveAdminIcon,
    role: "primary_admin",
  },
];

export default function UserRootLayout() {
  return (
    <NavigationContainer
      routes={menuRoutes}
      tabBarStyle={sharedStyles.tabBar}
    />
  );
}
