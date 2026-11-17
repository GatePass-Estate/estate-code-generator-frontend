import { Platform, Text, View } from 'react-native';
import { useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Web is limited to email activation + password reset. Everything else lands here.
 */
export default function WebEmailPortalScreen() {
  useEffect(() => {
    if (Platform.OS === 'web') document.title = 'GatePass';
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-body">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-center font-ubuntu-semibold text-3xl text-primary">GatePass</Text>
        <Text className="mt-4 max-w-md text-center font-Inter text-base text-grey">
          This website is only for account activation and password reset links from your email.
        </Text>
        <Text className="mt-3 max-w-md text-center font-Inter text-base text-grey">
          Open the GatePass mobile app for sign-in and everything else.
        </Text>
      </View>
    </SafeAreaView>
  );
}
