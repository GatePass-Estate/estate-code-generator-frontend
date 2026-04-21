import { View, Text, Pressable, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";
import Back from "@/src/components/mobile/Back";
import { sharedStyles } from "@/src/theme/styles";
import icons from "@/src/constants/icons";

export default function AccountSecurityScreen() {
  return (
    <SafeAreaView style={[sharedStyles.container, sharedStyles.modalContainer]}>
      <Stack.Screen options={{ headerShown: false }} />
      <Back type="short-arrow" />

      <View className="flex-1">
        <Text
          className="text-[22px] text-primary mb-[15px] font-ubuntu-bold mt-[30px]"
          style={{ fontSize: 23 }}
        >
          Account Security
        </Text>
        <Text className="text-xs font-inter-medium text-[#172024] mb-[30px] leading-[14px]">
          Manage your security settings and update your password for quick
          secure access.
        </Text>

        <Pressable
          className="flex-row justify-between items-center gap-10 h-14 bg-[#F7F9F9] rounded-[8px] px-5"
          onPress={() => router.push("/profile/edit/password")}
        >
          <Text className="text-[15px] font-inter-regular  text-[#172024]">Change Password</Text>
          <Image
            source={icons.rightIcon}
            style={{ width: 14, height: 14 }}
            resizeMode="contain"
          />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
