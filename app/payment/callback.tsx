import { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams, usePreventRemove } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { PaymentProcessingState } from '@/src/components/common/PaymentProcessingModal';
import { refreshBillingData } from '@/src/hooks/useBillingQueries';
import {
  CheckoutStatusOverlay,
  POLL_ATTEMPTS,
  checkoutStatusToOverlayState,
  clearPendingWebCheckout,
  pollCheckoutStatus,
  readPendingWebCheckout,
} from '@/src/lib/billingCheckout';
import { useAuthStore } from '@/src/lib/stores/authStore';
import type { CheckoutSessionStatus } from '@/src/types/billing';

const firstParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

/**
 * Paystack's `callback_url` (`<frontend>/payment/callback`, set per environment on the backend).
 *
 * Web: the checkout tab comes back here from Paystack. When this tab started the checkout (see
 * `usePaystackCheckout`), the page verifies the payment behind the same overlay as the app. The
 * page can't be left or refreshed without a warning until that finishes, then it goes to Billing.
 *
 * Otherwise (the app intercepts this URL in its checkout sheet, so this is only seen when the
 * checkout was opened in another browser) it tells the user they can go back to the app. Public
 * route: no sign-in needed.
 */
export default function PaymentCallbackScreen() {
  const params = useLocalSearchParams<{ reference?: string; trxref?: string }>();
  const hasSession = useAuthStore((s) => Boolean(s.access_token));
  const [pending] = useState(() =>
    Platform.OS === 'web' && hasSession
      ? readPendingWebCheckout(firstParam(params.reference) ?? firstParam(params.trxref))
      : null
  );
  const [state, setState] = useState<PaymentProcessingState>('verifying');
  const [status, setStatus] = useState<CheckoutSessionStatus>();
  const [done, setDone] = useState(false);

  // Holds the page (and, on web, warns before a refresh/close) until the user has seen the result.
  // It also keeps the signed-in start-up redirect from taking the user away mid-verification.
  const verifying = Boolean(pending) && !done;
  const disablePrevention = usePreventRemove(verifying);

  useEffect(() => {
    if (!pending) return;
    const controller = new AbortController();
    void (async () => {
      const result = await pollCheckoutStatus(
        pending.reference,
        pending.token,
        POLL_ATTEMPTS,
        controller.signal
      );
      if (controller.signal.aborted) return;
      if (result === 'paid') await refreshBillingData();
      if (controller.signal.aborted) return;
      clearPendingWebCheckout();
      setStatus(result);
      setState(checkoutStatusToOverlayState(result));
    })();
    return () => controller.abort();
  }, [pending]);

  useEffect(() => {
    if (!done) return;
    disablePrevention();
    router.replace('/billing');
  }, [done, disablePrevention]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F6F7F7' }}>
      <Stack.Screen options={{ headerShown: false, title: 'Payment received' }} />
      {pending ? (
        <CheckoutStatusOverlay
          visible={!done}
          state={state}
          kind={pending.kind}
          status={status}
          onClose={() => setDone(true)}
        />
      ) : (
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
      )}
    </SafeAreaView>
  );
}
