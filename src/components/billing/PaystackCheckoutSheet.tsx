import { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { classifyCheckoutNavigation } from '@/src/lib/billing';

export type PaystackCheckoutResult = 'returned' | 'cancelled';

type PaystackCheckoutSheetProps = {
  /** Paystack `authorization_url`; the sheet is open while this is set. */
  url: string | null;
  /** Session reference, used to recognise Paystack's redirect back to our callback. */
  reference: string | null;
  onFinish: (result: PaystackCheckoutResult) => void;
};

/**
 * In-app Paystack checkout (same layout as the AI marketplace checkout sheet). Paystack's redirect to
 * the backend callback (a web page, not part of the app) is intercepted before it loads, so the user
 * never leaves the app: the sheet closes and the caller verifies the payment.
 */
export default function PaystackCheckoutSheet({
  url,
  reference,
  onFinish,
}: PaystackCheckoutSheetProps) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const confirmClose = () => {
    Alert.alert('Cancel payment?', 'Your plan will not change unless the payment is completed.', [
      { text: 'Keep paying', style: 'cancel' },
      { text: 'Cancel payment', style: 'destructive', onPress: () => onFinish('cancelled') },
    ]);
  };

  return (
    <Modal
      visible={Boolean(url)}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={confirmClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top', 'bottom']}>
        <View className="flex-row items-center justify-between border-b border-[#EFF1F3] p-4">
          <Pressable
            onPress={confirmClose}
            hitSlop={14}
            accessibilityRole="button"
            accessibilityLabel="Close checkout"
            className="-ml-2 p-2"
          >
            <MaterialIcons name="close" size={24} color="#113E55" />
          </Pressable>
          <Text allowFontScaling={false} className="font-inter-medium text-[16px] text-[#113E55]">
            Checkout
          </Text>
          <View className="w-10" />
        </View>

        {url ? (
          <View className="flex-1">
            {loadError ? (
              <View className="flex-1 items-center justify-center gap-4 px-8">
                <Text className="text-center font-inter-regular text-[14px] text-[#0A1F29]">
                  The payment page could not be loaded. Check your connection and try again.
                </Text>
                <Pressable
                  onPress={() => {
                    setLoadError(false);
                    setLoading(true);
                    setAttempt((n) => n + 1);
                  }}
                  accessibilityRole="button"
                  className="rounded-full bg-[#113E55] px-6 py-3"
                >
                  <Text className="font-inter-medium text-[14px] text-white">Try again</Text>
                </Pressable>
              </View>
            ) : (
              <WebView
                key={attempt}
                source={{ uri: url }}
                style={{ flex: 1 }}
                originWhitelist={['*']}
                onLoadStart={() => setLoading(true)}
                onLoadEnd={() => setLoading(false)}
                onError={() => setLoadError(true)}
                onShouldStartLoadWithRequest={(request) => {
                  // Sub-frames (card/3-D Secure widgets) never end the checkout.
                  if (request.isTopFrame === false) return true;
                  const action = classifyCheckoutNavigation(request.url, reference);
                  if (action === 'return') {
                    onFinish('returned');
                    return false;
                  }
                  if (action === 'cancel') {
                    onFinish('cancelled');
                    return false;
                  }
                  if (!/^(https?|about|data|blob):/i.test(request.url)) {
                    // Bank apps / USSD / tel: links: hand them to the OS.
                    void Linking.openURL(request.url).catch(() => undefined);
                    return false;
                  }
                  return true;
                }}
              />
            )}
            {loading && !loadError ? (
              <View className="absolute inset-0 items-center justify-center bg-white/70">
                <ActivityIndicator color="#113E55" />
              </View>
            ) : null}
          </View>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}
