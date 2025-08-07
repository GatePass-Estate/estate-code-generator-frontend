import React, { useEffect, useState, useCallback } from "react";
import {
  Platform,
  View,
  TextInput,
  Image,
  Text,
  ActivityIndicator,
  type ViewStyle,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/nativewindui/Button";
import { useColorScheme } from "@/lib/useColorScheme";
import * as WebBrowser from "expo-web-browser";
import * as SplashScreen from "expo-splash-screen";
import { useAuth } from "@/hooks/useAuthContext";
import { useRouter } from "expo-router";
import { loginUser } from "@/lib/api";

WebBrowser.maybeCompleteAuthSession();
SplashScreen.preventAutoHideAsync();

const ROOT_STYLE: ViewStyle = {
  flex: 1,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "white",
  marginTop: -120,
};

export default function Login() {
  const { colors } = useColorScheme();
  const { signIn } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [appIsReady, setAppIsReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const prepare = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    };
    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) return null;

 const handleSignInPress = async () => {
  setIsLoading(true);
  try {
    const result = await loginUser(email, password);

    console.log("Login result:", result); // ✅ Check that this includes access_token

    // ✅ Pass full response directly to signIn
    await signIn(result);
    

    setErrorMessage("");

    // Route user based on role
    if (
      result.role === "primary_admin" ||
      result.role === "root" ||
      result.role === "admin"
    ) {
      router.replace("/(admin)");
    } else if (result.role === "resident") {
      router.replace("/(protected)");
    } else if (result.role === "security") {
      router.replace("/(security)");
    } else {
      setErrorMessage("Incorrect username or password");
    }
  } catch (error: any) {
    setErrorMessage(error.message || "Login failed");
  } finally {
    setIsLoading(false);
  }
};


  const isLargeScreen = width > 768;

  return (
    <SafeAreaView style={ROOT_STYLE} onLayout={onLayoutRootView}>
      {isLargeScreen && (
        <View
          style={{
            width: "40%",
            height: "100%",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "white",
          }}
        >
          <Image
            source={require("@/assets/Frame 12.png")}
            resizeMode="contain"
            style={{ width: 300, height: 300 }}
          />
        </View>
      )}
      <View
        style={{
          width: isLargeScreen ? "60%" : "100%",
          maxWidth: 500,
          paddingHorizontal: 16,
          paddingVertical: 24,
          backgroundColor: "white",
          alignSelf: "center",
        }}
      >
        <View
          style={{
            justifyContent: "center",
            alignItems: "center",
            paddingTop: 40,
            paddingBottom: 24,
          }}
        >
          <Text
            style={{
              marginTop: 70,
              color: "#113E55",
              fontFamily: "UbuntuSans",
              fontSize: 40,
              fontWeight: "400",
              textAlign: "center",
            }}
          >
            Welcome !
          </Text>
          <Text
            style={{
              color: "black",
              fontWeight: "500",
              fontSize: 10,
              textAlign: "center",
              marginTop: 4,
            }}
          >
            Sign in to send invites to your guests
          </Text>
        </View>
        <View style={{ gap: 16 }}>
          <View>
            <Text style={{ color: "#113E55", paddingBottom: 4 }}>
              Email Address
            </Text>
            <TextInput
              placeholder="Enter your email address..."
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              style={{
                backgroundColor: "#F7F9F9",
                borderWidth: 1,
                borderColor: "#D1D5DB",
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
              }}
            />
          </View>
          <View>
            <Text style={{ color: "#113E55", paddingBottom: 4 }}>Password</Text>
            <TextInput
              placeholder="Enter your password..."
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              style={{
                backgroundColor: "#F7F9F9",
                borderWidth: 1,
                borderColor: "#D1D5DB",
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
              }}
            />
          </View>
          {errorMessage ? (
            <Text
              style={{
                color: "red",
                textAlign: "center",
                marginTop: 8,
              }}
            >
              {errorMessage}
            </Text>
          ) : null}
          <View style={{ gap: 20, marginTop: 16 }}>
            <Button
              size={Platform.select({ ios: "lg", default: "lg" })}
              style={{
                backgroundColor: "#113E55",
                height: 50,
                width: "90%",
                alignSelf: "center",
                justifyContent: "center",
                borderRadius: 8,
                flexDirection: "row",
                alignItems: "center",
              }}
              onPress={handleSignInPress}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "white", textAlign: "center" }}>
                  Sign In
                </Text>
              )}
            </Button>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
