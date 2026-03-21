import CustomSafeAreaView from "@/src/components/CustomSafeAreaView";
import { activateUser } from "@/src/lib/api/user";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, TextInput, TouchableOpacity, Platform } from "react-native";
import { Text, View } from "react-native";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";

const MIN_PASSWORD_LENGTH = 8;

const WebSetPasswordView = ({
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  showPassword,
  isSubmitting,
  errorMessage,
  handleSubmit,
}: any) => {
  return (
    <View className="flex-1 w-full bg-white items-center justify-center">
      <View
        style={{
          backgroundColor: "#fbfeff",
          width: "100%",
          maxWidth: 600,
          paddingHorizontal: 32,
          paddingVertical: 40,
          borderRadius: 8,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontFamily: "UbuntuSans-Regular",
            fontSize: 37.9,
            color: "#172024",
            lineHeight: 52,
            marginBottom: 40,
          }}
        >
          Set Password
        </Text>

        {errorMessage ? (
          <Text
            style={{
              fontFamily: "Inter-regular",
              color: "#DC2626",
              fontSize: 14,
              marginBottom: 20,
              textAlign: "center",
            }}
          >
            {errorMessage}
          </Text>
        ) : null}

        <View style={{ width: 496, marginBottom: 32, maxWidth: "100%" }}>
          <Text
            style={{
              fontFamily: "Inter-regular",
              fontSize: 16,
              color: "#9b9797",
              marginBottom: 20,
              lineHeight: 18,
            }}
          >
            Create New Password
          </Text>
          <TextInput
            placeholder="Enter new password"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            editable={!isSubmitting}
            placeholderTextColor="#9b9797"
            style={{
              backgroundColor: "#f7f9f9",
              borderRadius: 20,
              paddingHorizontal: 32,
              paddingVertical: 24,
              fontFamily: "Inter-regular",
              fontSize: 16,
              color: "#172024",
              width: "100%",
              outlineStyle: "none",
            } as any}
          />
        </View>

        <View style={{ width: 496, marginBottom: 64, maxWidth: "100%" }}>
          <Text
            style={{
              fontFamily: "Inter-regular",
              fontSize: 16,
              color: "#9b9797",
              marginBottom: 20,
              lineHeight: 18,
            }}
          >
            Confirm New Password
          </Text>
          <TextInput
            placeholder="Confirm new password"
            secureTextEntry={!showPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            editable={!isSubmitting}
            placeholderTextColor="#9b9797"
            style={{
              backgroundColor: "#f7f9f9",
              borderRadius: 20,
              paddingHorizontal: 32,
              paddingVertical: 24,
              fontFamily: "Inter-regular",
              fontSize: 16,
              color: "#172024",
              width: "100%",
              outlineStyle: "none",
            } as any}
          />
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={{
            backgroundColor: "#113e55",
            borderRadius: 8,
            paddingHorizontal: 32,
            paddingVertical: 20,
            width: 496,
            maxWidth: "100%",
            justifyContent: "center",
            alignItems: "center",
            opacity: isSubmitting ? 0.6 : 1,
          }}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fbfeff" />
          ) : (
            <Text
              style={{
                fontFamily: "UbuntuSans-SemiBold",
                fontSize: 16,
                color: "#fbfeff",
                lineHeight: 16,
              }}
            >
              Submit
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const SetPasswordPage = () => {
  const { user_id, email } = useLocalSearchParams<{
    user_id?: string;
    email?: string;
  }>();
  const router = useRouter();

  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (errorMessage) setErrorMessage("");
  }, [password, confirmPassword]);

  const handleSubmit = useCallback(async () => {
    setErrorMessage("");

    if (!password || !confirmPassword) {
      setErrorMessage("Both password fields are required.");
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setErrorMessage(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (!user_id) {
      setErrorMessage("Verification failed. Please try the link again.");
      return;
    }

    setIsSubmitting(true);

    try {
      await activateUser({
        user_id,
        new_password: password,
      });
      router.replace("/auth/email-activation-status");
    } catch (error: any) {
      setErrorMessage(
        error.message || "Failed to set password. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [password, confirmPassword, user_id, router]);

  if (!user_id) {
    return <Redirect href="/auth/email-activation-status?status=error" />;
  }

  if (Platform.OS === "web") {
    return (
      <WebSetPasswordView
        password={password}
        setPassword={setPassword}
        confirmPassword={confirmPassword}
        setConfirmPassword={setConfirmPassword}
        showPassword={showPassword}
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
        handleSubmit={handleSubmit}
      />
    );
  }

  return (
    <>
      <CustomSafeAreaView>
        <View className="px-5 flex-1 w-full   flex flex-col gap-[98px] justify-center">
          <View className="flex flex-col gap-[34px]">
            <Text
              style={{
                fontFamily: "UbuntuSans-Medium",
                color: "#113E55",
                fontSize: 28.43,
              }}
            >
              Set Password
            </Text>
            {errorMessage ? (
              <Text
                style={{
                  fontFamily: "Inter-regular",
                  color: "#DC2626",
                  fontSize: 12,
                }}
              >
                {errorMessage}
              </Text>
            ) : null}

            <View className="flex  gap-10">
              <View className="flex flex-col gap-[0.5rem]">
                <Text
                  style={{
                    fontFamily: "Inter-regular",
                    color: "#113E55",
                    fontSize: 9,
                    letterSpacing: -0.24,
                  }}
                >
                  New password
                </Text>
                <TextInput
                  placeholder="Enter your new password..."
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  editable={!isSubmitting}
                  className="bg-[#F7F9F9]  placeholder:text-[#9B9797] font-medium font-inter leading-[14px] text-xs  text-[#9B9797] rounded-lg p-4"
                  contextMenuHidden={true}
                  selectTextOnFocus={false}
                />
              </View>

              <View className="flex flex-col gap-[0.5rem]">
                <Text
                  style={{
                    fontFamily: "Inter-regular",
                    color: "#113E55",
                    fontSize: 9,
                    letterSpacing: -0.24,
                  }}
                >
                  Confirm password
                </Text>
                <TextInput
                  placeholder="Confirm your password..."
                  secureTextEntry={!showPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  editable={!isSubmitting}
                  className="bg-[#F7F9F9]  placeholder:text-[#9B9797] font-medium font-inter leading-[14px] text-xs  text-[#9B9797] rounded-lg px-4 py-4"
                  contextMenuHidden={true}
                  selectTextOnFocus={false}
                />
              </View>
            </View>
          </View>

          <View className="w-full px-[29px] ">
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              className={`py-4 bg-[#113E55] rounded-lg justify-center items-center ${isSubmitting ? "opacity-60" : ""}`}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  style={{
                    fontFamily: "UbuntuSans-SemiBold",
                    color: "#fff",
                    fontSize: 16,
                    letterSpacing: -0.24,
                  }}
                >
                  Submit
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </CustomSafeAreaView>
    </>
  );
};

export default SetPasswordPage;
