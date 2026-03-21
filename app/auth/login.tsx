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
import { Link, useRouter } from "expo-router";
import { fetchMe, loginUser } from "@/src/lib/api/auth";
import { useAuthStore } from "@/src/lib/stores/authStore";
import { broadcastLogin, getWidthBreakpoint, storeAuthState } from "@/src/lib/helpers";
import Images from "@/src/constants/images";
import { cn } from "@/src/lib/cn";
import icons from "@/src/constants/icons";
import LoadingTransition from "@/src/components/common/LoadingTransition";

WebBrowser.maybeCompleteAuthSession();
SplashScreen.preventAutoHideAsync();

export default function Login() {
  const { signIn } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [appIsReady, setAppIsReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
      useAuthStore.setState({
        access_token: result.access_token,
        role: result.role,
      });
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
                  Sign In
                </Text>
              )}
            </Button>

            <Button
              className={`self-center rounded-lg flex-row items-center justify-center w-11/12 h-14 bg-dark-teal ${isLoading ? "opacity-70" : ""}`}
              size={Platform.select({ ios: "lg", default: "lg" })}
              disabled={isLoading}
            >
              <Text className="text-white font-UbuntuSans font-semibold text-center">
                Continue With Google
              </Text>
            </Button>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
