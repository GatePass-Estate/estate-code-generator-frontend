import { useUserStore } from "@/src/lib/stores/userStore";
import { useRouter } from "expo-router";
import { View, Text, Pressable, Modal, Image, Platform } from "react-native";
import { useState, useRef, useContext } from "react";
import { HeaderHeightContext } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/src/hooks/useAuthContext";
import icons from "@/src/constants/icons";

export default function UserIcon({ type = "admin" }: { type?: string }) {
  const first_name = useUserStore((state) => state.first_name);
  const last_name = useUserStore((state) => state.last_name);
  const role = useUserStore((state) => state.role);
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const buttonRef = useRef<View>(null);
  const { signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const headerHeight = useContext(HeaderHeightContext);

  const isMobile = Platform.OS !== "web";

  /**
   * Fullscreen Modal is drawn from y=0. Fixed dp (e.g. 46/12) does not scale across notches / header configs.
   * Use React Navigation’s measured header height when present; else safe-area top + one moderate bar fallback.
   */
  const dropdownTopPadding =
    typeof headerHeight === "number" && headerHeight > 0
      ? headerHeight
      : insets.top + (Platform.OS === "web" ? 12 : 20);

  const initials = `${first_name?.charAt(0) ?? ""}${last_name?.charAt(0) ?? ""}`;

  const isAdmin = ["admin", "primary_admin"].includes(role!);
  const adminSwitchPath = type === "admin" ? "/admin" : "/user";
  const adminSwitchLabel = type === "admin" ? "Admin" : "Home";
  const adminSwitchIcon =
    type === "admin" ? icons.activeAdminIcon : icons.homeDropdown;
  const adminSwitchIconStyle =
    type === "admin" ? { width: 14, height: 18 } : { width: 18, height: 18 };

  const handleNavigation = (path: string) => {
    setShowDropdown(false);
    if (path === "/profile" || path === "/settings") {
      router.push(path);
    } else {
      router.replace(path);
    }
  };

  const handleIconPress = () => setShowDropdown(true);

  return (
    <>
      <View ref={buttonRef} className={`${isMobile && "mr-5"}`}>
        <Pressable
          onPress={handleIconPress}
          className="flex-row items-center gap-2"
        >
          <View
            className={`${Platform.OS === "web" ? "w-12 h-12" : "w-9 h-9"} rounded-full border border-teal justify-center items-center`}
          >
            <Text className="uppercase text-teal font-light font-ubuntu text-xl">
              {initials}
            </Text>
          </View>
        </Pressable>
      </View>

      <Modal
        visible={showDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}
      >
        <Pressable
          className="flex-1 bg-primary/20 justify-start pr-5 "
          style={{ paddingTop: dropdownTopPadding }}
          onPress={() => setShowDropdown(false)}
        >
          <View
            className="self-end bg-white rounded-3xl border border-accent shadow-md p-2 py-3 w-60"
            style={{ minWidth: 120 }}
          >
            {isAdmin && (
              <Pressable
                className="py-3 px-4 flex gap-2 flex-row bg-accent rounded-2xl"
                onPress={() => handleNavigation(adminSwitchPath)}
              >
                <Image
                  source={adminSwitchIcon}
                  style={adminSwitchIconStyle}
                />
                <Text className="text-primary font-inter-medium">
                  {adminSwitchLabel}
                </Text>
              </Pressable>
            )}

            <Pressable
              className={`py-3 px-4 flex gap-2 flex-row ${isAdmin ? "" : "bg-accent rounded-2xl"}`}
              onPress={() => handleNavigation("/settings")}
            >
              <Image
                source={icons.activeProfileIcon}
                style={{ width: 18, height: 18 }}
              />
              <Text className="text-primary font-inter-medium">Settings</Text>
            </Pressable>

            <Pressable
              className="py-3 px-4 flex gap-2 flex-row border-t border-gray-200 pt-4 mt-1"
              onPress={signOut}
            >
              <Image
                source={icons.logoutDropdown}
                style={{ width: 18, height: 18 }}
              />
              <Text className="text-primary font-inter-medium">Logout</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
