import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { router, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import { useState } from "react";
import { useAuth } from "@/src/hooks/useAuthContext";
import { useUserStore } from "@/src/lib/stores/userStore";
import { deleteAccount } from "@/src/lib/api/user";
import Back from "@/src/components/mobile/Back";
import { sharedStyles } from "@/src/theme/styles";
import icons from "@/src/constants/icons";

function SettingsRow({
  label,
  onPress,
  showChevron = true,
}: {
  label: string;
  onPress: () => void;
  showChevron?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between border border-[#CEE5ED] rounded-[8px] px-4 h-[52px] bg-white "
    >
      <Text className="text-[13px] font-inter-regular text-primary">{label}</Text>
      {showChevron ? (
        <View className="w-5 h-5">
          <Image source={icons.slideUp} style={{ width: 20, height: 20 }} resizeMode="contain" />
        </View>
      ) : null}
    </Pressable>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Text className="text-xs font-inter-medium uppercase tracking-wider text-grey mt-6 mb-2">
      {children}
    </Text>
  );
}

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const user_id = useUserStore((s) => s.user_id);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = () => {
    Alert.alert(
      "Delete account",
      "This will permanently remove your account and sign you out. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!user_id) return;
            setDeleting(true);
            try {
              await deleteAccount();
              await signOut();
            } catch (e: any) {
              Alert.alert(
                "Could not delete account",
                e?.message ?? "Please try again later.",
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={[sharedStyles.container, sharedStyles.modalContainer]}>
      <Stack.Screen options={{ headerShown: false }} />
      <Back type="short-arrow" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 46, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          className=" text-primary mb-1 font-ubuntu-bold mt-7"
          style={{ fontSize: 22 }}
        >
          Settings
        </Text>

        <Text className="text-[10px] font-inter-medium uppercase tracking-wider text-grey mt-6 mb-3">
          Account
        </Text>
        <View className="flex flex-col gap-2">
          <SettingsRow
            label="My Profile"
            onPress={() => router.push("/profile")}
          />
          <SettingsRow
            label="Account Security"
            onPress={() => router.push("/account-security")}
          />
        </View>

        <Text className="text-[10px] font-inter-medium uppercase tracking-wider text-grey mt-12 mb-2">
          About
        </Text>
        <View className="flex flex-col gap-2">
          <SettingsRow
            label="Terms of Use"
            onPress={() =>
              router.push({
                pathname: "/auth/tos",
                params: { readonly: "true" },
              })
            }
          />
          <SettingsRow
            label="Data Privacy"
            onPress={() =>
              router.push({
                pathname: "/auth/data-protection-policy",
                params: { source: "settings" },
              })
            }
          />
        </View>

        <Text className="text-[10px] font-inter-medium uppercase tracking-wider text-grey mt-[42px] mb-2">
          Sign out
        </Text>
        <Pressable
          onPress={signOut}
          className="flex-row items-center  border border-[#CEE5ED] rounded-[8px] px-4 h-[52px] bg-white"
        >
          <Text className="text-[13px] font-inter-regular text-primary text-center">
            Log Out
          </Text>
        </Pressable>

        <View className="mt-auto pt-8">
          <Pressable
            onPress={confirmDelete}
            disabled={deleting}
            className="px-4 h-[52px] flex justify-center items-center"
          >
            {deleting ? (
              <ActivityIndicator color="#F46036" />
            ) : (
              <Text className="text-[15px] font-inter-medium text-[#F46036]">
                Delete Account
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
