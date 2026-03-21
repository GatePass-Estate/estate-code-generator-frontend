import { useLocalSearchParams, useRouter } from "expo-router";

import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const BLUR_ELLIPSE_STYLES = StyleSheet.create({
  success: {
    position: "absolute" as const,
    width: 457.325,
    height: 424.527,
    top: -80,
    left: -180,
    zIndex: 0,
    transform: [{ rotate: "-15.472deg" }],
  },
  error: {
    position: "absolute" as const,
    width: 457.325,
    height: 424.527,
    bottom: -160,
    left: -80,
    zIndex: 0,
    transform: [{ rotate: "-15.472deg" }],
  },
  web: {
    filter: "blur(50px)",
  } as any,
});

const getEllipseContainerStyle = (status?: string) =>
  status === "error" ? BLUR_ELLIPSE_STYLES.error : BLUR_ELLIPSE_STYLES.success;

const BlurEllipse = ({ status }: { status?: string }) => (
  <View style={getEllipseContainerStyle(status)} pointerEvents="none">
    {Platform.OS === "web" ? (
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: 228.66,
            backgroundColor: "rgba(25, 84, 113, 0.20)",
            ...BLUR_ELLIPSE_STYLES.web,
          },
        ]}
      />
    ) : (
      <Image
        source={require("@/src/assets/images/blur-ellipse.png")}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
    )}
  </View>
);

const WebSuccessView = ({ router }: { router: any }) => (
  <View className="flex-1 w-full bg-[#FBFEFF] items-center justify-center overflow-hidden">
    <View
      style={{
        width: "100%",
        maxWidth: 1440,
        height: 900,
        position: "relative",
      }}
    >
      {/* Ellipse */}
      <View
        style={{
          position: "absolute",
          left: "16.67%",
          marginLeft: 8,
          top: 260,
          width: 400,
          height: 396,
          transform: [{ rotate: "-15.47deg" }],
        }}
      >
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: 228.66,
              backgroundColor: "rgba(25, 84, 113, 0.20)",
              filter: "blur(50px)",
            } as any,
          ]}
        />
      </View>

      {/* Rocket Image */}
      <View
        style={{
          position: "absolute",
          left: "25%",
          marginLeft: 10,
          top: 338,
          width: 318,
          height: 318,
        }}
      >
        <Image
          source={require("@/src/assets/images/success-rocket.png")}
          style={{ width: "100%", height: "100%" }}
          resizeMode="contain"
        />
      </View>

      {/* Content */}
      <View
        style={{
          position: "absolute",
          left: "41.67%",
          marginLeft: 91,
          top: 388,
        }}
      >
        <Text
          style={{
            fontFamily: "UbuntuSans-Medium",
            color: "#113E55",
            fontSize: 28.43,
            lineHeight: 34,
            width: 444,
            marginLeft: -15,
          }}
        >
          You Are All Set !
        </Text>
        <Text
          style={{
            fontFamily: "Inter-regular",
            color: "#172024",
            fontSize: 16,
            lineHeight: 18,
            width: 496,
            marginTop: 30,
          }}
        >
          Your account is now verified and your password set.{"\n"}
          You can now continue and start using GatePass.{"\n"}
          Welcome aboard!
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/auth/login")}
          style={{
            marginTop: 74,
            width: 451,
            height: 54,
            backgroundColor: "#113E55",
            borderRadius: 8,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontFamily: "UbuntuSans-SemiBold",
              color: "#fbfeff",
              fontSize: 16,
              lineHeight: 16,
            }}
          >
            Go to Login Page
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

const WebErrorView = () => (
  <View className="flex-1 w-full bg-[#FBFEFF] items-center justify-center overflow-hidden">
    <View
      style={{
        width: "100%",
        maxWidth: 1440,
        height: 900,
        position: "relative",
      }}
    >
      {/* Ellipse */}
      <View
        style={{
          position: "absolute",
          left: "8.33%",
          marginLeft: 74,
          top: 260,
          width: 400,
          height: 396,
          transform: [{ rotate: "-15.47deg" }],
        }}
      >
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: 228.66,
              backgroundColor: "rgba(25, 84, 113, 0.20)",
              filter: "blur(50px)",
            } as any,
          ]}
        />
      </View>

      {/* Credit Card Image */}
      <View
        style={{
          position: "absolute",
          left: "16.67%",
          marginLeft: 57,
          top: 291,
          width: 256,
          height: 256,
        }}
      >
        <Image
          source={require("@/src/assets/images/credit-card.png")}
          style={{ width: "100%", height: "100%" }}
          resizeMode="contain"
        />
      </View>

      {/* Content */}
      <View
        style={{
          position: "absolute",
          left: "41.67%",
          marginLeft: 35,
          top: 385,
        }}
      >
        <Text
          style={{
            fontFamily: "UbuntuSans-Medium",
            color: "#113E55",
            fontSize: 28.43,
            lineHeight: 34,
            width: 444,
            marginLeft: -12,
          }}
        >
          Opps!
        </Text>
        <Text
          style={{
            fontFamily: "Inter-regular",
            color: "#172024",
            fontSize: 16,
            lineHeight: 18,
            width: 496,
            marginTop: 24,
          }}
        >
          This verification link is invalid or may have expired. For your
          security, verification links can only be used once and are active for
          a limited time.{"\n\n"}
          Kindly notify Admin.
        </Text>
      </View>
    </View>
  </View>
);

const EmailActivationStatusPage = () => {
  const { status } = useLocalSearchParams<{ status?: string }>();
  const router = useRouter();
  const isError = status === "error";

  if (Platform.OS === "web") {
    return isError ? <WebErrorView /> : <WebSuccessView router={router} />;
  }

  return (
    <View className="w-full h-full flex-1">
      <View className="w-full h-full flex-1">
        {isError ? (
          <View className="w-full h-full flex flex-1 relative overflow-hidden bg-[#FBFEFF]">
            <View className="flex-1 w-full justify-center flex flex-col z-10">
              <View className="flex flex-col justify-center min-w-full items-center">
                <View style={{ width: 242, height: 242 }}>
                  <Image
                    source={require("@/src/assets/images/credit-card.png")}
                    style={{ width: 242, height: 242 }}
                    resizeMode="contain"
                  />
                </View>

                <View className="w-full flex flex-col gap-[1.5rem] items-center">
                  <Text
                    style={{
                      fontFamily: "UbuntuSans-Medium",
                      color: "#113E55",
                      fontSize: 28.43,
                      lineHeight: 34,
                    }}
                  >
                    Opps!!
                  </Text>
                  <Text
                    style={{
                      fontSize: 16,
                      textAlign: "center",
                      maxWidth: 287,
                      lineHeight: 18,
                      color: "#172024",
                      fontFamily: "Inter-regular",
                    }}
                  >
                    This access link is no longer valid. Kindly notify the
                    admin.
                  </Text>
                </View>
              </View>
            </View>
            <BlurEllipse status={status} />
          </View>
        ) : (
          <View className="w-full h-full flex flex-1 relative overflow-hidden bg-[#FBFEFF]">
            <BlurEllipse status={status} />
            <View className="flex-1 w-full justify-center flex flex-col z-10">
              <View className="flex flex-col justify-center min-w-full items-center">
                <View style={{ width: 246, height: 246, marginTop: -40 }}>
                  <Image
                    source={require("@/src/assets/images/success-rocket.png")}
                    className="h-full w-full"
                    resizeMode="cover"
                  />
                </View>

                <View className="w-full flex flex-col items-center mt-6">
                  <Text
                    style={{
                      fontFamily: "UbuntuSans-Medium",
                      color: "#113E55",
                      fontSize: 28.43,
                      lineHeight: 34,
                      marginBottom: 27,
                    }}
                  >
                    You Are All Set !
                  </Text>

                  <Text
                    style={{
                      fontSize: 16,
                      textAlign: "center",
                      maxWidth: 287,
                      lineHeight: 18,
                      color: "#172024",
                      fontFamily: "Inter-regular",
                      marginBottom: 38,
                    }}
                  >
                    Your account is now verified and{"\n"}your password set.
                  </Text>

                  <TouchableOpacity
                    onPress={() => router.push("/auth/login")}
                    className="h-[48px] w-[278px] bg-[#113E55] rounded-lg justify-center items-center"
                  >
                    <Text
                      style={{
                        fontFamily: "UbuntuSans-SemiBold",
                        color: "#fbfeff",
                        fontSize: 16,
                        letterSpacing: -0.24,
                      }}
                    >
                      Go to Login Page
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

export default EmailActivationStatusPage;
