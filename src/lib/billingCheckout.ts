import { useCallback, useRef, useState } from 'react';
import { Alert, AppState } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import {
  fetchCheckoutStatus,
  refreshBillingData,
  useInitializeCheckout,
  type InitializeCheckoutParams,
} from '@/src/hooks/useBillingQueries';
import type { CheckoutSessionStatus } from '@/src/types/billing';

export type CheckoutOutcome = CheckoutSessionStatus | 'error';

const POLL_INTERVAL_MS = 2000;
const POLL_ATTEMPTS = 30;
/** How long to wait for the browser to cover the app before assuming it never took over. */
const BROWSER_TAKEOVER_TIMEOUT_MS = 3000;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Android custom tabs: `openBrowserAsync` resolves as soon as the tab is launched. Wait for the app
 * to leave the foreground and come back. If it never leaves within a few seconds (the browser did
 * not take over), stop waiting so the status poll can still run.
 */
function waitForReturnFromBrowser(): Promise<void> {
  return new Promise((resolve) => {
    let leftApp = AppState.currentState !== 'active';
    const finish = () => {
      clearTimeout(timer);
      subscription.remove();
      resolve();
    };
    const timer = setTimeout(() => {
      if (!leftApp) finish();
    }, BROWSER_TAKEOVER_TIMEOUT_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') leftApp = true;
      else if (leftApp) finish();
    });
  });
}

async function pollCheckoutStatus(reference: string, token: string): Promise<CheckoutOutcome> {
  for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt += 1) {
    try {
      const { status } = await fetchCheckoutStatus(reference, token);
      if (status !== 'pending') return status;
    } catch {
      // Transient network errors: keep polling until attempts run out.
    }
    await wait(POLL_INTERVAL_MS);
  }
  return 'pending';
}

/** Default user feedback for a finished checkout. */
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

/**
 * Paystack checkout: initialize a session, open the payment page in the system browser, then poll
 * its status once the user is back in the app. Refreshes billing data when the payment is `paid`.
 * Initialization/browser errors are shown in an Alert and resolve to `'error'`. A second call while
 * one is running resolves to `'error'` without doing anything (double-tap protection).
 */
export function usePaystackCheckout() {
  const { mutateAsync: initializeCheckout } = useInitializeCheckout();
  const [isRunning, setIsRunning] = useState(false);
  // State updates are async; the ref blocks a second tap that lands before the re-render.
  const runningRef = useRef(false);

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
        try {
          const result = await WebBrowser.openBrowserAsync(session.authorization_url);
          if (result.type === WebBrowser.WebBrowserResultType.OPENED) {
            await waitForReturnFromBrowser();
          }
        } catch {
          Alert.alert(
            'Checkout failed',
            'Could not open the payment page. Please check that a web browser is installed.'
          );
          return 'error';
        }
        const outcome = await pollCheckoutStatus(
          session.paystack_reference,
          session.checkout_token
        );
        if (outcome === 'paid') await refreshBillingData();
        return outcome;
      } finally {
        runningRef.current = false;
        setIsRunning(false);
      }
    },
    [initializeCheckout]
  );

  return { startCheckout, isRunning };
}
