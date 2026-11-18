import { Image, Linking, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Images from '@/src/shared/constants/images';

const APP_STORE_URL = 'https://apps.apple.com/ke/app/gatepass-ng/id6766627688';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.gatepassng.gms';
const SUPPORT_EMAIL = 'info@gatepassng.com';

function StoreButton({
  icon,
  eyebrow,
  title,
  url,
}: {
  icon: 'logo-apple' | 'logo-google-playstore';
  eyebrow: string;
  title: string;
  url: string;
}) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${eyebrow} ${title}`}
      onPress={() => void Linking.openURL(url)}
      className="h-14 w-full flex-row items-center justify-center gap-3 rounded-xl border border-[#A6A6A6] bg-black px-5 active:opacity-80 sm:w-auto sm:min-w-[180px]"
    >
      <Ionicons name={icon} size={28} color="#FFFFFF" />
      <View>
        <Text className="font-Inter text-[10px] uppercase leading-3 text-white">{eyebrow}</Text>
        <Text className="font-ubuntu-semibold text-lg leading-6 text-white">{title}</Text>
      </View>
    </Pressable>
  );
}

/**
 * Web is limited to email activation + password reset. Everything else lands here,
 * including after activation "Done", with links to get the mobile app.
 */
export default function WebEmailPortalScreen() {
  useEffect(() => {
    if (Platform.OS === 'web') document.title = 'GatePass';
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-body">
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <View className="w-full items-center px-6 py-10">
          <Image
            source={Images.logo}
            accessibilityLabel="GatePass"
            style={{ width: 72, height: 72 }}
            resizeMode="contain"
          />
          <Text className="mt-6 text-center font-ubuntu-semibold text-2xl text-primary sm:text-3xl">
            GatePass is on mobile
          </Text>
          <Text className="mt-4 max-w-md text-center font-Inter text-base text-grey">
            GatePass is built to be used from your phone. Download the app to create visitor passes,
            manage who gets into your estate and get real-time alerts at the gate.
          </Text>
          <View className="mt-6 w-full max-w-[280px] gap-3 sm:max-w-none sm:flex-row sm:justify-center">
            <StoreButton
              icon="logo-apple"
              eyebrow="Download on the"
              title="App Store"
              url={APP_STORE_URL}
            />
            <StoreButton
              icon="logo-google-playstore"
              eyebrow="Get it on"
              title="Google Play"
              url={PLAY_STORE_URL}
            />
          </View>
          <Text className="mt-6 max-w-md text-center font-Inter text-sm text-grey">
            Need help getting started? Contact us at{' '}
            <Text
              accessibilityRole="link"
              onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
              className="font-Inter text-sm text-primary underline"
            >
              {SUPPORT_EMAIL}
            </Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
