// Primidac here - Logic and button for the Google Sign in was commented out instead of removed entirely just incase we need to fall back to the feature in the future.
import * as WebBrowser from "expo-web-browser";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Platform,
  View,
  TextInput,
  Image,
  Text,
  ActivityIndicator,
  useWindowDimensions,
  Pressable,
} from "react-native";
import { FontAwesome, AntDesign } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/src/components/nativewindui/Button";
import { useAuth } from "@/src/hooks/useAuthContext";
import { useRouter, useLocalSearchParams } from "expo-router";
import { fetchMe, loginUser } from "@/src/lib/api/auth";
import { useAuthStore } from "@/src/lib/stores/authStore";
import { broadcastLogin, getWidthBreakpoint, storeAuthState } from "@/src/lib/helpers";
import Images from "@/src/constants/images";
import { cn } from "@/src/lib/cn";
import icons from "@/src/constants/icons";
import LoadingTransition from "@/src/components/common/LoadingTransition";

// WebBrowser.maybeCompleteAuthSession();
SplashScreen.preventAutoHideAsync();

export default function Login() {
  const { signIn } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const searchParams = useLocalSearchParams<{ tos_rejected?: string }>();

  const [appIsReady, setAppIsReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showTosRejected, setShowTosRejected] = useState(searchParams.tos_rejected === "true");

  const isLargeScreen = width > getWidthBreakpoint();

  useEffect(() => {
    const prepare = async () => {
      await new Promise((r) => setTimeout(r, 1000));
      setAppIsReady(true);
    };
    prepare();
  }, []);

  useEffect(() => {
    if (errorMessage) setErrorMessage("");
  }, [email, password]);

  const handleSignInPress = useCallback(async () => {
    setErrorMessage("");
    setIsLoading(true);

    if (!email || !password) {
      setErrorMessage("Email and password are required.");
      setIsLoading(false);
      return;
    }

    const emailValue = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) {
      setErrorMessage("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }

    if (password.length < 3) {
      setErrorMessage("Please enter a valid password.");
      setIsLoading(false);
      return;
    }

    try {
      const result = await loginUser(emailValue, password);

      if (result.requires_tos_acceptance && result.access_token) {
        router.push({
          pathname: "/auth/tos",
          params: { token: result.access_token, role: result.role || "" },
        });
        setIsLoading(false);
        return;
      }

      useAuthStore.setState({ access_token: result.access_token, role: result.role });
      await storeAuthState(result);

      // Broadcast login to other tabs (web only)
      broadcastLogin(result.access_token, result.role);

      signIn(await fetchMe(result.access_token));

      if (
        result.role === "resident" ||
        ["primary_admin", "admin"].includes(result.role!)
      ) {
        router.replace("/user");
      } else if (result.role === "security") {
        router.replace("/security");
      } else {
        setErrorMessage("Incorrect username or password.");
      }
    } catch (error: any) {
      setErrorMessage(error.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  }, [email, password, signIn, router]);

  useEffect(() => {
    if (Platform.OS === "web") document.title = "Login - GatePass";
  }, []);

  const ErrorBanner = useMemo(
    () =>
      errorMessage ? (
        <View className="bg-red-50 p-5 rounded-lg flex-row justify-between items-center mb-4">
          <View className="flex-row items-center flex-1">
            <FontAwesome name="warning" size={15} color="#DC2626" />
            <Text className="ml-2 text-danger flex-shrink">{errorMessage}</Text>
          </View>
          <Pressable onPress={() => setErrorMessage("")}>
            <AntDesign name="close" size={15} color="#DC2626" />
          </Pressable>
        </View>
      ) : null,
    [errorMessage],
  );

  if (!appIsReady) return <LoadingTransition />;

  return (
    <>
      <SafeAreaView
        className={`h-full ${isLargeScreen ? "grid grid-cols-12" : "flex-1 bg-white"}`}
      >
        {isLargeScreen && (
          <View className="col-span-6 relative h-screen overflow-hidden">
            <Image
              source={Images.loginImage}
              resizeMode="cover"
              className="absolute inset-0 w-full h-full"
            />
          </View>
        )}

        <View
          className={cn(
            `p-6 w-full self-center ${isLargeScreen ? "col-span-6" : ""} `,
          )}
          style={{
            flex: 1,
            justifyContent: "center",
          }}
        >
          <View className="items-center mb-10 text-center max-w-xl">
            <Text
              className={`text-primary font-UbuntuSans ${isLargeScreen ? "text-7xl" : "text-5xl"}`}
            >
              Welcome !
            </Text>
            <Text
              className={`mt-1 text-black font-Inter ${isLargeScreen ? "text-base" : "text-xs font-medium"}`}
            >
              Sign in to send invites to your guests
            </Text>
          </View>

          <View className="gap-4 max-w-xl">
            {showTosRejected && !isLargeScreen && (
              <View
                style={{
                  borderRadius: 16,
                  borderWidth: 0.5,
                  borderColor: "#FFCDD2",
                  backgroundColor: "#FFF0F0",
                  paddingVertical: 14,
                  paddingHorizontal: 20,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  alignSelf: "center",
                  gap: 10,
                }}
              >
                <FontAwesome name="warning" size={18} color="#E53935" />
                <Text
                  style={{
                    color: "#E53935",
                    fontSize: 14,
                    fontFamily: "Ubuntu-BoldItalic",
                    textAlign: "center",
                    fontWeight: "bold",
                    fontStyle: "italic",
                  }}
                >
                  Please Accept Terms and Conditions{"\n"}to use GatePass
                </Text>
              </View>
            )}

            {ErrorBanner}

            <View>
              <Text
                className={`pb-1 text-grey ${isLargeScreen ? "text-base" : ""}`}
              >
                Email Address
              </Text>
              <TextInput
                placeholder="Enter your email address..."
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                editable={!isLoading}
                className="bg-[#F7F9F9] border border-[#D1D5DB] rounded-lg px-4 py-5 mt-1"
              />
            </View>

            <View>
              <Text
                className={`pb-1 text-grey ${isLargeScreen ? "text-base" : ""}`}
              >
                Password
              </Text>
              <View className="relative">
                <TextInput
                  placeholder="Enter your password..."
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  editable={!isLoading}
                  className="bg-[#F7F9F9] border border-[#D1D5DB] rounded-lg px-4 py-5 mt-1 pr-12"
                  contextMenuHidden={true}
                  selectTextOnFocus={false}
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-6"
                  disabled={isLoading}
                >
                  <Image
                    source={showPassword ? icons.eye : icons.hiddenEye}
                    style={{ width: 20, height: 20 }}
                    resizeMode="contain"
                  />
                </Pressable>
              </View>

              <Pressable
                className="mt-5 self-start"
                onPress={() => router.push("/auth/forgot-password")}
              >
                <Text
                  className="text-primary font-ubuntu-medium text-base underline"
                  style={{ letterSpacing: -0.24, lineHeight: 16 }}
                >
                  Forgot Password?
                </Text>
              </Pressable>
            </View>

            <View className="mt-4 gap-5">
              <Button
                className={`self-center rounded-lg flex-row items-center justify-center w-11/12 h-14 ${isLoading ? "opacity-70" : ""}`}
                size={Platform.select({ ios: "lg", default: "lg" })}
                onPress={handleSignInPress}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-UbuntuSans font-semibold text-center">
                    Continue
                  </Text>
                )}
              </Button>

              <View className="mt-1 flex-row justify-center flex-wrap items-center">
                <Text className="text-grey font-Inter text-sm">By continuing, you agree to our </Text>
                <Pressable onPress={() => router.push({ pathname: '/auth/tos', params: { readonly: 'true' } })}>
                  <Text className="text-primary font-ubuntu-medium text-sm underline">Terms of Service</Text>
                </Pressable>
              </View>

              {/* <Button
                className={`self-center rounded-lg flex-row items-center justify-center w-11/12 h-14 bg-dark-teal ${isLoading ? "opacity-70" : ""}`}
                size={Platform.select({ ios: "lg", default: "lg" })}
                disabled={isLoading}
              >
                <Text className="text-white font-UbuntuSans font-semibold text-center">
                  Continue With Google
                </Text>
              </Button> */}
            </View>
          </View>
        </View>
      </SafeAreaView>

      {showTosRejected && isLargeScreen && (
        <View className="absolute top-10 left-0 right-0 items-center z-50">
          <View
            className="bg-white rounded-2xl p-5 border border-red-100 flex-row items-start gap-4 shadow-sm"
            style={{
              width: 500,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 4.65,
              elevation: 8,
            }}
          >
            <Image
              source={require("@/src/assets/condition.svg")}
              style={{ width: 48, height: 48 }}
              resizeMode="contain"
            />
            <View className="flex-1 mt-0.5">
              <Text className="font-ubuntu-bold text-lg text-black">
                Terms of Service
              </Text>
              <Text className="font-inter-regular text-sm text-[#4B5563] mt-2 leading-5">
                Access to GatePass requires your acceptance of our Terms and
                Conditions.{"\n\n"}Please review and accept them to continue.
              </Text>
            </View>
            <Pressable
              className="p-1.5 rounded-lg active:bg-gray-100 bg-[#F9FAFB]"
              onPress={() => setShowTosRejected(false)}
            >
              <AntDesign name="close" size={18} color="#9CA3AF" />
            </Pressable>
          </View>
        </View>
      )}
    </>
  );
}
