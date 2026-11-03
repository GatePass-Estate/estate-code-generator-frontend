import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

/**
 * Paystack's `callback_url` (https://app.gatepassng.com/payment/callback, set on the backend). The app
 * intercepts it inside its checkout sheet; this page is only seen when the checkout was opened in a
 * regular browser, so it tells the user they can go back to the app. Public route: no sign-in needed.
 */
export default function PaymentCallbackScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F6F7F7' }}>
      <Stack.Screen options={{ headerShown: false, title: 'Payment received' }} />
      <View className="flex-1 items-center justify-center px-6">
        <View className="w-full max-w-[420px] items-center gap-4 rounded-[20px] bg-white px-6 py-10">
          <Ionicons name="checkmark-circle" size={56} color="#1B998B" />
          <Text className="text-center font-ubuntu-medium text-[24px] leading-[29px] text-[#113E55]">
            Payment received
          </Text>
          <Text className="text-center font-inter-regular text-[14px] leading-[20px] text-[#0A1F29]">
            You can close this window and return to the GatePass app. Your plan updates as soon as
            the payment is confirmed.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
