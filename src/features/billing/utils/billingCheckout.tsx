import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import PaystackCheckoutSheet, {
  type PaystackCheckoutResult,
} from '@/src/features/billing/components/PaystackCheckoutSheet';
import PaymentProcessingModal, {
  type PaymentProcessingCopyMap,
  type PaymentProcessingState,
} from '@/src/features/billing/components/PaymentProcessingModal';
import {
  fetchCheckoutStatus,
  refreshBillingData,
  requestCheckoutCancellation,
  useBillingAccess,
  useInitializeCheckout,
  type InitializeCheckoutParams,
} from '@/src/features/billing/hooks/billing';
import {
  checkoutSignature,
  findOpenCheckoutAttempt,
  finishCheckoutAttempt,
  interpretCheckoutCancel,
  markCheckoutSubmitted,
  initializeCheckoutAttempt,
  prepareCheckoutAttempt,
  stableCheckoutParams,
} from '@/src/features/billing/utils/checkoutAttempts';
import { errorMessage, errorStatus } from '@/src/shared/services/api/errors';
import type { CheckoutKind, CheckoutSessionStatus } from '@/src/features/billing/types/billing';

export type CheckoutOutcome = CheckoutSessionStatus | 'cancelled' | 'error';

const POLL_INTERVAL_MS = 2000;
export const POLL_ATTEMPTS = 30;
/** After a manual close, a short check in case the payment went through just before. */
const CANCEL_CHECK_ATTEMPTS = 2;
/** iOS can't present a modal while the Paystack page sheet is still sliding away. */
const SHEET_DISMISS_MS = Platform.OS === 'ios' ? 500 : 0;
/** iOS: if the overlay still isn't on screen after this, mount it again (up to the retry count). */
const OVERLAY_SHOW_TIMEOUT_MS = 1500;
const OVERLAY_SHOW_RETRIES = 2;

/** Resolves after `ms`, or straight away once `signal` aborts. */
function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve) => {
    if (signal?.aborted) {
      resolve();
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/** Polls until the session leaves `pending` or attempts run out. Stops early (as `pending`) on abort. */
export async function pollCheckoutStatus(
  reference: string,
  token: string,
  attempts: number,
  signal?: AbortSignal
): Promise<CheckoutSessionStatus> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (signal?.aborted) return 'pending';
    try {
      const { status } = await fetchCheckoutStatus(reference, token);
      if (status !== 'pending') return status;
    } catch {
      // Transient network errors: keep polling until attempts run out.
    }
    if (attempt < attempts - 1) await wait(POLL_INTERVAL_MS, signal);
  }
  return 'pending';
}

/**
 * Ask the server to cancel a checkout the user left. The response status wins: a payment that
 * landed first is `paid`, not cancelled. A network failure leaves the attempt in place.
 */
async function settleAbandonedCheckout(
  reference: string,
  token: string
): Promise<'paid' | 'cleared' | 'uncertain'> {
  const fromStatus = async (): Promise<'paid' | 'cleared' | 'uncertain'> => {
    try {
      const { status } = await fetchCheckoutStatus(reference, token);
      if (status === 'paid') return 'paid';
      if (status === 'failed' || status === 'expired' || status === 'cancelled') {
        await finishCheckoutAttempt(reference);
        return 'cleared';
      }
    } catch {
      return 'uncertain';
    }
    return 'uncertain';
  };

  let cancelReached = false;
  try {
    const result = await requestCheckoutCancellation(reference, token);
    cancelReached = true;
    const outcome = interpretCheckoutCancel(result.status);
    if (outcome === 'paid') return 'paid';
    if (outcome === 'cancelled' || outcome === 'ended') {
      await finishCheckoutAttempt(reference);
      return 'cleared';
    }
  } catch (error) {
    // Already gone: nothing left to conflict with the next purchase.
    if (errorStatus(error) === 404) {
      await finishCheckoutAttempt(reference);
      return 'cleared';
    }
  }
  const followUp = await fromStatus();
  if (followUp !== 'uncertain') return followUp;
  // The user left before paying, and neither cancel nor a status read reported a charge.
  // Forget the session so the next purchase is not blocked by it.
  if (cancelReached) {
    await finishCheckoutAttempt(reference);
    return 'cleared';
  }
  return 'uncertain';
}

/**
 * A different purchase still has an open session. Cancel it only when status is pending and the
 * user has not submitted payment. Paid, submitted, or unreadable sessions block a new charge.
 */
async function releaseOtherCheckout(
  estateId: string,
  exceptSignature: string
): Promise<'clear' | 'paid' | 'blocked'> {
  const other = findOpenCheckoutAttempt(estateId, exceptSignature);
  if (!other?.session) return 'clear';
  if (other.submitted) return 'blocked';

  let status: CheckoutSessionStatus | null = null;
  try {
    ({ status } = await fetchCheckoutStatus(other.session.reference, other.session.token));
  } catch {
    status = null;
  }
  if (status === 'paid') {
    await finishCheckoutAttempt(other.session.reference);
    await refreshBillingData();
    return 'paid';
  }
  if (status === 'failed' || status === 'expired' || status === 'cancelled') {
    await finishCheckoutAttempt(other.session.reference);
    return 'clear';
  }
  // A status this app does not know is left alone. A pending one was never submitted, so it must
  // not block a different purchase after the user has cancelled.
  if (status !== null && status !== 'pending') return 'blocked';

  const settled = await settleAbandonedCheckout(other.session.reference, other.session.token);
  if (settled === 'paid') {
    await finishCheckoutAttempt(other.session.reference);
    await refreshBillingData();
    return 'paid';
  }
  if (settled === 'cleared') return 'clear';
  // Status was pending and no charge was reported. Drop it. Keeping it is what showed
  // "Checkout still open" after a cancel.
  if (status === 'pending') {
    await finishCheckoutAttempt(other.session.reference);
    return 'clear';
  }
  return 'blocked';
}

/** Overlay state for a finished verification. */
export function checkoutStatusToOverlayState(
  status: CheckoutSessionStatus
): Exclude<PaymentProcessingState, 'verifying'> {
  if (status === 'paid') return 'success';
  if (status === 'pending') return 'delayed';
  return 'failed';
}

const SUCCESS_MESSAGES: Partial<Record<CheckoutKind, string>> = {
  tier: 'Your subscription is now active.',
  custom: 'Your subscription is now active.',
  renew: 'Your plan has been renewed.',
  tier_upgrade_immediate: 'Your plan has been upgraded.',
  seat_add: 'Your seats have been updated.',
  ai_only: 'Your AI tools are now active.',
};

/** Estate plan checkout copy for the payment overlay (`status`: the finished session status). */
export function getCheckoutOverlayCopy(
  kind?: CheckoutKind | null,
  status?: CheckoutSessionStatus
): PaymentProcessingCopyMap {
  const subject =
    kind === 'seat_add' ? 'Your seats' : kind === 'ai_only' ? 'Your AI tools' : 'Your plan';
  return {
    verifying: {
      title: 'Processing payment',
      message:
        "Processing your payment. Please don't close the app or refresh this page until payment processing is done.",
    },
    cancelling: {
      title: 'Cancelling checkout',
      message: 'Cancelling this checkout. Please wait.',
    },
    success: {
      title: 'Payment successful',
      message: (kind && SUCCESS_MESSAGES[kind]) || 'Your plan has been updated.',
      actionLabel: 'Continue',
    },
    delayed: {
      title: 'Payment processing',
      message: `We have not received confirmation yet. ${subject} will update once the payment is confirmed.`,
      actionLabel: 'Got it',
    },
    failed:
      status === 'expired'
        ? {
            title: 'Checkout expired',
            message: 'This checkout session expired. Please start again.',
            actionLabel: 'Close',
          }
        : status === 'cancelled'
          ? {
              title: 'Checkout cancelled',
              message: 'This checkout was cancelled. You can start again.',
              actionLabel: 'Close',
            }
          : {
              title: 'Payment failed',
              message: 'Your payment was not completed. Please try again.',
              actionLabel: 'Close',
            },
  };
}

export const CHECKOUT_OVERLAY_WARNING = 'Do not close or refresh this page';

/** The estate plan payment overlay (shared by the in-app checkout and the web callback page). */
export function CheckoutStatusOverlay({
  visible,
  state,
  kind,
  status,
  onClose,
  onShow,
}: {
  visible: boolean;
  state: PaymentProcessingState;
  kind?: CheckoutKind | null;
  status?: CheckoutSessionStatus;
  onClose: () => void;
  onShow?: () => void;
}) {
  return (
    <PaymentProcessingModal
      visible={visible}
      status={state}
      copy={getCheckoutOverlayCopy(kind, status)}
      warningLabel={CHECKOUT_OVERLAY_WARNING}
      onClose={onClose}
      onShow={onShow}
    />
  );
}

/**
 * Outcomes are now shown by the checkout overlay (`checkoutSheet`), which `startCheckout` waits on
 * before it resolves, so this shows nothing. Kept so existing callers keep compiling.
 * @deprecated Drop the call; the overlay already told the user.
 */
export function showCheckoutOutcomeAlert(_outcome: CheckoutOutcome, _successMessage: string) {}

// ---- Web: Paystack takes over the tab and returns to /payment/callback --------------------------

export type PendingWebCheckout = {
  reference: string;
  token: string;
  kind: CheckoutKind;
  savedAt: number;
};

const PENDING_WEB_CHECKOUT_KEY = 'gatepass.pendingCheckout';
/** The checkout token is valid for 2 hours (revenue_service CHECKOUT_TOKEN_EXPIRY_SECONDS). */
const PENDING_WEB_CHECKOUT_MAX_AGE_MS = 2 * 60 * 60 * 1000;

function webSessionStorage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

export function savePendingWebCheckout(checkout: PendingWebCheckout) {
  try {
    webSessionStorage()?.setItem(PENDING_WEB_CHECKOUT_KEY, JSON.stringify(checkout));
  } catch {
    // Storage full or blocked: the callback page then shows its plain "payment received" note.
  }
}

/**
 * The checkout this tab started, when it is recent and matches the reference Paystack returned
 * with (when the URL has one).
 */
export function readPendingWebCheckout(urlReference?: string | null): PendingWebCheckout | null {
  try {
    const raw = webSessionStorage()?.getItem(PENDING_WEB_CHECKOUT_KEY);
    if (!raw) return null;
    const pending = JSON.parse(raw) as Partial<PendingWebCheckout>;
    if (!pending?.reference || !pending.token || !pending.kind || !pending.savedAt) return null;
    if (Date.now() - pending.savedAt > PENDING_WEB_CHECKOUT_MAX_AGE_MS) return null;
    if (urlReference && urlReference !== pending.reference) return null;
    return pending as PendingWebCheckout;
  } catch {
    return null;
  }
}

export function clearPendingWebCheckout() {
  try {
    webSessionStorage()?.removeItem(PENDING_WEB_CHECKOUT_KEY);
  } catch {
    // Nothing to clean up.
  }
}

// ---- Hook ---------------------------------------------------------------------------------------

type ActiveCheckout = { url: string; reference: string };
type OverlayState = {
  /** False while the overlay fades out (its last content stays on screen until then). */
  open: boolean;
  state: PaymentProcessingState;
  kind: CheckoutKind;
  status?: CheckoutSessionStatus;
};

/**
 * Paystack checkout: initialize a session, show Paystack in an in-app sheet (render
 * `checkoutSheet` in the screen), and verify the payment once Paystack redirects back or the user
 * closes the sheet.
 *
 * After Paystack redirects back, a payment overlay (in `checkoutSheet`) covers the screen and
 * can't be closed while the payment is verified, then shows the result. `startCheckout` resolves
 * once the user closes that result, so callers can navigate straight away. Billing data is
 * refreshed when the payment is `paid`. A sheet closed before paying shows a cancelling overlay
 * while the session is checked and cancelled, then the overlay closes. If the payment had already
 * gone through, that overlay becomes the success result instead.
 *
 * Web: Paystack can't be embedded, so the tab goes to Paystack and comes back to
 * `/payment/callback`, which verifies with the same overlay; `startCheckout` never resolves there.
 *
 * Initialization errors are shown in an Alert and resolve to `'error'`; a second call while one is
 * running also resolves to `'error'` without doing anything (double-tap protection). If the screen
 * unmounts mid-checkout, polling stops and the call resolves to `'cancelled'`.
 *
 * Retries never blindly charge again (see checkoutAttempts.ts): each purchase keeps its session and
 * Idempotency-Key until it is paid, failed or expired. Starting the same purchase again first asks
 * the server: already paid → success overlay; submitted and still pending → "processing" overlay;
 * closed before paying → the same session reopens; failed/expired → a new session; status
 * unreadable → nothing starts.
 */
export function usePaystackCheckout() {
  const { denyIfUnauthorized, notifyActionError, estateId } = useBillingAccess();
  const { mutateAsync: initializeCheckout } = useInitializeCheckout();
  const [isRunning, setIsRunning] = useState(false);
  const [active, setActive] = useState<ActiveCheckout | null>(null);
  const [overlay, setOverlay] = useState<OverlayState | null>(null);
  const [overlayKey, setOverlayKey] = useState(0);
  // State updates are async; the ref blocks a second tap that lands before the re-render.
  const runningRef = useRef(false);
  const finishRef = useRef<((result: PaystackCheckoutResult) => void) | null>(null);
  const dismissRef = useRef<(() => void) | null>(null);
  const signalRef = useRef<AbortSignal | null>(null);
  const overlayShownKeyRef = useRef<number | null>(null);
  const overlayRetriesRef = useRef(0);

  // Aborted on unmount: stops polling and timers and unwinds a running checkout without state
  // updates. Created in the effect so a StrictMode remount gets a fresh controller.
  useEffect(() => {
    const controller = new AbortController();
    signalRef.current = controller.signal;
    return () => {
      controller.abort();
      const finish = finishRef.current;
      finishRef.current = null;
      finish?.('cancelled');
      const dismiss = dismissRef.current;
      dismissRef.current = null;
      dismiss?.();
    };
  }, []);

  // Web: Back from Paystack can restore this page from the bfcache with the checkout still marked
  // as running (the tab left before `finally` could reset it), leaving Pay disabled.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      runningRef.current = false;
      setIsRunning(false);
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  const handleFinish = useCallback((result: PaystackCheckoutResult) => {
    const finish = finishRef.current;
    finishRef.current = null;
    setActive(null);
    finish?.(result);
  }, []);

  const handleOverlayClose = useCallback(() => {
    const dismiss = dismissRef.current;
    dismissRef.current = null;
    dismiss?.();
  }, []);

  /** Shows the result overlay and resolves when the user closes it. */
  const showResult = useCallback(
    async (status: CheckoutSessionStatus, kind: CheckoutKind, signal: AbortSignal) => {
      await new Promise<void>((resolve) => {
        dismissRef.current = resolve;
        setOverlay({ open: true, state: checkoutStatusToOverlayState(status), kind, status });
      });
      if (signal.aborted) return;
      setOverlay((current) => (current ? { ...current, open: false } : null));
    },
    []
  );

  const startCheckout = useCallback(
    async (params: InitializeCheckoutParams): Promise<CheckoutOutcome> => {
      if (denyIfUnauthorized()) return 'error';
      if (runningRef.current) return 'error';
      const signal = signalRef.current ?? new AbortController().signal;
      runningRef.current = true;
      setIsRunning(true);
      let leavingPage = false;
      try {
        const { idempotencyKey: _ignored, ...purchase } = params;
        const stablePurchase = stableCheckoutParams(purchase);
        const kind = params.checkout_kind;
        const attemptEstateId = params.estate_id ?? estateId ?? '';
        const signature = checkoutSignature(attemptEstateId, stablePurchase);

        // Before any new charge: what happened to the last attempt at this same purchase?
        const decision = await prepareCheckoutAttempt(
          signature,
          attemptEstateId,
          fetchCheckoutStatus
        );
        if (signal.aborted) return 'cancelled';

        if (decision.kind === 'unknown') {
          notifyActionError(
            'Checking your last payment',
            undefined,
            "We couldn't confirm the payment you started earlier for this purchase, so we haven't started a new one. Check your connection and try again."
          );
          return 'error';
        }
        if (decision.kind === 'paid') {
          await finishCheckoutAttempt(decision.session.reference);
          await refreshBillingData();
          if (signal.aborted) return 'cancelled';
          await showResult('paid', kind, signal);
          return signal.aborted ? 'cancelled' : 'paid';
        }
        if (decision.kind === 'processing') {
          await showResult('pending', kind, signal);
          return signal.aborted ? 'cancelled' : 'pending';
        }

        const otherOpen = findOpenCheckoutAttempt(attemptEstateId, signature);
        if (otherOpen?.session && !signal.aborted) {
          setOverlay({ open: true, state: 'cancelling', kind });
        }
        const released = await releaseOtherCheckout(attemptEstateId, signature);
        if (otherOpen?.session) {
          setOverlay((current) =>
            current?.state === 'cancelling' ? { ...current, open: false } : current
          );
          await wait(SHEET_DISMISS_MS, signal);
        }
        if (signal.aborted) return 'cancelled';
        if (released === 'paid') {
          notifyActionError(
            'Earlier payment completed',
            undefined,
            'A payment you started earlier was confirmed, so this checkout was not started. Your billing details have been refreshed.'
          );
          return 'error';
        }
        if (released === 'blocked') {
          notifyActionError(
            'Checkout still open',
            undefined,
            'You have an unfinished payment for a different purchase, and it could not be cancelled. Finish that payment or try again.'
          );
          return 'error';
        }

        let session;
        try {
          session = await initializeCheckoutAttempt(
            signature,
            attemptEstateId,
            decision,
            (idempotencyKey) => initializeCheckout({ ...stablePurchase, idempotencyKey }),
            errorStatus
          );
        } catch (error: unknown) {
          const status = errorStatus(error);
          if (status === 409) void refreshBillingData();
          // Left the screen: no alert over whatever the user is looking at now.
          if (!signal.aborted) {
            if (status === 409) {
              const other = findOpenCheckoutAttempt(attemptEstateId, signature);
              notifyActionError(
                'Checkout conflict',
                { message: errorMessage(error) },
                other
                  ? 'You have an unfinished payment for a different purchase. Finish it or wait for it to expire, then try again.'
                  : 'A conflicting checkout or subscription request already exists. Your billing details have been refreshed.'
              );
            } else if (status === 422) {
              notifyActionError(
                'Invalid checkout details',
                { message: errorMessage(error) },
                'Please review your plan selection and try again.'
              );
            } else {
              notifyActionError(
                'Checkout failed',
                { message: errorMessage(error) },
                'Could not start checkout.'
              );
            }
          }
          return 'error';
        }
        const reference = session.paystack_reference;
        if (signal.aborted) return 'cancelled';

        if (Platform.OS === 'web') {
          // The tab leaves for Paystack; /payment/callback picks the checkout up from here.
          savePendingWebCheckout({
            reference,
            token: session.checkout_token,
            kind,
            savedAt: Date.now(),
          });
          window.location.assign(session.authorization_url);
          leavingPage = true;
          return await new Promise<CheckoutOutcome>(() => undefined);
        }

        const result = await new Promise<PaystackCheckoutResult>((resolve) => {
          finishRef.current = resolve;
          setActive({ url: session.authorization_url, reference });
        });
        if (signal.aborted) return 'cancelled';

        const returned = result === 'returned';
        if (returned) await markCheckoutSubmitted(reference);
        // Started now, so the overlay never tries to present over the closing sheet.
        const sheetGone = wait(SHEET_DISMISS_MS, signal);
        const polling = pollCheckoutStatus(
          reference,
          session.checkout_token,
          returned ? POLL_ATTEMPTS : CANCEL_CHECK_ATTEMPTS,
          signal
        );
        await sheetGone;
        if (signal.aborted) return 'cancelled';
        setOverlay({ open: true, state: returned ? 'verifying' : 'cancelling', kind });

        const status = await polling;
        if (signal.aborted) return 'cancelled';
        // A finished session is forgotten. A still-pending one is kept only when the user did not
        // cancel, so a retry reopens it instead of starting a second charge.
        if (status !== 'pending') await finishCheckoutAttempt(reference);
        if (status === 'paid') await refreshBillingData();
        if (signal.aborted) return 'cancelled';
        // Closed before paying: cancel only after the server still reports the session unpaid.
        if (!returned && status === 'pending') {
          const settled = await settleAbandonedCheckout(reference, session.checkout_token);
          if (signal.aborted) return 'cancelled';
          if (settled === 'paid') {
            await finishCheckoutAttempt(reference);
            await refreshBillingData();
            await sheetGone;
            if (signal.aborted) return 'cancelled';
            await showResult('paid', kind, signal);
            return signal.aborted ? 'cancelled' : 'paid';
          }
          if (settled !== 'cleared') await finishCheckoutAttempt(reference);
          setOverlay((current) => (current ? { ...current, open: false } : null));
          return 'cancelled';
        }

        await sheetGone;
        if (signal.aborted) return 'cancelled';
        await showResult(status, kind, signal);
        if (signal.aborted) return 'cancelled';
        return status;
      } finally {
        if (!signal.aborted && !leavingPage) {
          runningRef.current = false;
          setIsRunning(false);
        }
      }
    },
    [denyIfUnauthorized, estateId, initializeCheckout, notifyActionError, showResult]
  );

  // iOS drops a modal presented while another is still dismissing. If the overlay hasn't shown up
  // in time, mount it again so the user is never left behind an invisible overlay.
  const overlayVisible = overlay?.open ?? false;
  useEffect(() => {
    if (!overlayVisible) {
      overlayShownKeyRef.current = null;
      overlayRetriesRef.current = 0;
      return;
    }
    if (Platform.OS !== 'ios') return;
    const timer = setTimeout(() => {
      if (
        overlayShownKeyRef.current !== overlayKey &&
        overlayRetriesRef.current < OVERLAY_SHOW_RETRIES
      ) {
        overlayRetriesRef.current += 1;
        setOverlayKey((key) => key + 1);
      }
    }, OVERLAY_SHOW_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [overlayVisible, overlayKey]);

  const checkoutSheet = (
    <>
      {Platform.OS === 'web' ? null : (
        <PaystackCheckoutSheet
          // Fresh WebView/loading state for every checkout.
          key={active?.reference ?? 'idle'}
          url={active?.url ?? null}
          reference={active?.reference ?? null}
          onFinish={handleFinish}
        />
      )}
      <CheckoutStatusOverlay
        key={`checkout-overlay-${overlayKey}`}
        visible={overlayVisible}
        state={overlay?.state ?? 'verifying'}
        kind={overlay?.kind}
        status={overlay?.status}
        onClose={handleOverlayClose}
        onShow={() => {
          overlayShownKeyRef.current = overlayKey;
        }}
      />
    </>
  );

  return { startCheckout, isRunning, checkoutSheet };
}
