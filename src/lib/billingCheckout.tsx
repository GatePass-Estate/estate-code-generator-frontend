import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';
import PaystackCheckoutSheet, {
  type PaystackCheckoutResult,
} from '@/src/components/billing/PaystackCheckoutSheet';
import {
  fetchCheckoutStatus,
  refreshBillingData,
  useInitializeCheckout,
  type InitializeCheckoutParams,
} from '@/src/hooks/useBillingQueries';
import type { CheckoutSessionStatus } from '@/src/types/billing';

export type CheckoutOutcome = CheckoutSessionStatus | 'cancelled' | 'error';

const POLL_INTERVAL_MS = 2000;
const POLL_ATTEMPTS = 30;
/** After a manual close, a short check in case the payment went through just before. */
const CANCEL_CHECK_ATTEMPTS = 2;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function pollCheckoutStatus(
  reference: string,
  token: string,
  attempts: number
): Promise<CheckoutSessionStatus> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const { status } = await fetchCheckoutStatus(reference, token);
      if (status !== 'pending') return status;
    } catch {
      // Transient network errors: keep polling until attempts run out.
    }
    if (attempt < attempts - 1) await wait(POLL_INTERVAL_MS);
  }
  return 'pending';
}

/** Default user feedback for a finished checkout (nothing for a cancel or an init error). */
export function showCheckoutOutcomeAlert(outcome: CheckoutOutcome, successMessage: string) {
  switch (outcome) {
    case 'paid':
      Alert.alert('Payment successful', successMessage);
      break;
    case 'failed':
      Alert.alert('Payment failed', 'Your payment was not completed. Please try again.');
      break;
    case 'expired':
      Alert.alert('Checkout expired', 'This checkout session expired. Please start again.');
      break;
    case 'pending':
      Alert.alert(
        'Payment processing',
        'We have not received confirmation yet. Your plan will update once the payment is confirmed.'
      );
      break;
    default:
      break;
  }
}

type ActiveCheckout = { url: string; reference: string };

/**
 * Paystack checkout: initialize a session, show Paystack in an in-app sheet (render
 * `checkoutSheet` in the screen), and verify the payment once Paystack redirects back or the user
 * closes the sheet. Refreshes billing data when the payment is `paid`. Initialization errors are
 * shown in an Alert and resolve to `'error'`; a second call while one is running also resolves to
 * `'error'` without doing anything (double-tap protection).
 */
export function usePaystackCheckout() {
  const { mutateAsync: initializeCheckout } = useInitializeCheckout();
  const [isRunning, setIsRunning] = useState(false);
  const [active, setActive] = useState<ActiveCheckout | null>(null);
  // State updates are async; the ref blocks a second tap that lands before the re-render.
  const runningRef = useRef(false);
  const finishRef = useRef<((result: PaystackCheckoutResult) => void) | null>(null);

  const handleFinish = useCallback((result: PaystackCheckoutResult) => {
    const finish = finishRef.current;
    finishRef.current = null;
    setActive(null);
    finish?.(result);
  }, []);

  const startCheckout = useCallback(
    async (params: InitializeCheckoutParams): Promise<CheckoutOutcome> => {
      if (runningRef.current) return 'error';
      runningRef.current = true;
      setIsRunning(true);
      try {
        let session;
        try {
          session = await initializeCheckout(params);
        } catch (error: any) {
          Alert.alert('Checkout failed', error?.message || 'Could not start checkout.');
          return 'error';
        }

        const result = await new Promise<PaystackCheckoutResult>((resolve) => {
          finishRef.current = resolve;
          setActive({ url: session.authorization_url, reference: session.paystack_reference });
        });

        const status = await pollCheckoutStatus(
          session.paystack_reference,
          session.checkout_token,
          result === 'returned' ? POLL_ATTEMPTS : CANCEL_CHECK_ATTEMPTS
        );
        if (status === 'paid') await refreshBillingData();
        // Closed before paying: a still-pending session is a cancel, not "processing".
        return result === 'cancelled' && status === 'pending' ? 'cancelled' : status;
      } finally {
        runningRef.current = false;
        setIsRunning(false);
      }
    },
    [initializeCheckout]
  );

  const checkoutSheet = (
    <PaystackCheckoutSheet
      // Fresh WebView/loading state for every checkout.
      key={active?.reference ?? 'idle'}
      url={active?.url ?? null}
      reference={active?.reference ?? null}
      onFinish={handleFinish}
    />
  );

  return { startCheckout, isRunning, checkoutSheet };
}
