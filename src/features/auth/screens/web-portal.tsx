import { Image, Platform, Text, View } from 'react-native';
import { useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Images from '@/src/shared/constants/images';

/**
 * Web is limited to email activation + password reset. Everything else lands here.
 * After activation "Done", we show a clear next step: open the mobile app and sign in.
 */
export default function WebEmailPortalScreen() {
  const params = useLocalSearchParams<{ from?: string | string[] }>();
  const from = Array.isArray(params.from) ? params.from[0] : params.from;
  const afterActivation = from === 'activation';

  useEffect(() => {
    if (Platform.OS === 'web') document.title = 'GatePass';
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-body">
      <View className="flex-1 items-center justify-center px-6">
        <Image
          source={Images.logo}
          accessibilityLabel="GatePass"
          style={{ width: 72, height: 72 }}
          resizeMode="contain"
        />
        {afterActivation ? (
          <>
            <Text className="mt-6 text-center font-ubuntu-semibold text-3xl text-primary">
              You&apos;re all set
            </Text>
            <Text className="mt-4 max-w-md text-center font-Inter text-base text-grey">
              Your account is activated. Open the GatePass mobile app and sign in to continue.
            </Text>
          </>
        ) : (
          <>
            <Text className="mt-6 max-w-md text-center font-Inter text-base text-grey">
              This website is only for account activation and password reset links from your email.
            </Text>
            <Text className="mt-3 max-w-md text-center font-Inter text-base text-grey">
              Open the GatePass mobile app for sign-in and everything else.
            </Text>
          </>
        )}
        <Text className="mt-6 text-center font-ubuntu-semibold text-3xl text-primary">
          Thank you
        </Text>
      </View>
    </SafeAreaView>
  );
}
