/**
 * One record per distinct checkout the user starts ("attempt"), so a retry never blindly starts a
 * second charge. The revenue service is the source of truth for the session; this only remembers
 * which session (and which Idempotency-Key) belongs to which purchase.
 *
 * Contract this relies on (revenue-service OpenAPI, POST /checkout/initialize):
 * - `Idempotency-Key` is required. Re-sending a key whose session is still open returns that same
 *   session; re-sending a key whose session failed or expired returns 409.
 * - GET /checkout/status/{reference} reports the session status (`pending | paid | failed | expired | cancelled`).
 * - POST /checkout/cancel/{reference} cancels a pending session only after Paystack confirms it was
 *   not already paid. The response `status` is that verified result and can be `paid`.
 *
 * Closing Paystack without paying asks the server to cancel, then forgets the attempt only when the
 * verified status is `cancelled`, `failed`, or `expired`. A still-open or unreadable session is kept.
 * Trying again with the same purchase checks the session first: paid → already done, still open →
 * reopen the same session (same key, no new charge), failed/expired/cancelled → a fresh key.
 *
 * The attempt is written before initialize runs, and read back on the next launch. Web uses
 * sessionStorage (the tab leaves for Paystack). Native uses AsyncStorage, because an in-memory key
 * dies with the process: the server would still have the open session and the next try would send
 * a new key.
 *
 * Paystack sends webhooks only for successful payments, possibly hours later, and the redirect back
 * can be lost (Paystack docs: Verify Payments, Webhooks). A session still `pending` is therefore
 * never treated as failed here.
 */
import { Platform } from 'react-native';
import { createIdempotencyKey } from '@/src/features/billing/utils/billing';
import type { CheckoutSessionStatus } from '@/src/features/billing/types/billing';

/** The checkout token (and so a remembered session) is valid for 2 hours (revenue_service). */
export const CHECKOUT_ATTEMPT_MAX_AGE_MS = 2 * 60 * 60 * 1000;

export type CheckoutAttemptSession = {
  reference: string;
  token: string;
  authorizationUrl: string;
};

export type CheckoutAttempt = {
  /** Estate + the exact purchase (kind, tier, seats, period…). */
  signature: string;
  estateId: string;
  /** Idempotency-Key for this attempt's POST /checkout/initialize. */
  key: string;
  createdAt: number;
  /** Set once initialize answered. Missing = the outcome of initialize is unknown (e.g. timeout). */
  session?: CheckoutAttemptSession;
  /** Paystack sent the user back (payment submitted), so a pending session is being processed. */
  submitted?: boolean;
};

/** What to do before (re)starting the checkout for a purchase. */
export type CheckoutAttemptDecision =
  /**
   * Call initialize with `key`. `replay`: the key was sent before (its session is still open, or
   * initialize never answered), so the server returns that session rather than charging again, and
   * a 409 means that session has since failed or expired.
   */
  | { kind: 'initialize'; key: string; replay: boolean }
  /** The previous attempt for this purchase is already paid: show success, don't charge again. */
  | { kind: 'paid'; session: CheckoutAttemptSession }
  /** Payment was submitted and is still being confirmed: show "processing", don't charge again. */
  | { kind: 'processing'; session: CheckoutAttemptSession }
  /** The previous attempt's status could not be read: don't risk a second charge yet. */
  | { kind: 'unknown' };

type StatusFetcher = (
  reference: string,
  token: string
) => Promise<{ status: CheckoutSessionStatus }>;

const STORAGE_KEY = 'gatepass.checkoutAttempts';
const attempts = new Map<string, CheckoutAttempt>();
/** Bumped when memory is dropped so an in-flight read cannot refill it afterwards. */
let generation = 0;
let loadPromise: Promise<void> | null = null;
let writeQueue: Promise<void> = Promise.resolve();

function webStorage(): Storage | null {
  if (Platform.OS !== 'web') return null;
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

function remember(raw: string | null) {
  if (!raw) return;
  try {
    for (const attempt of JSON.parse(raw) as CheckoutAttempt[]) {
      if (attempt?.signature && attempt.key) attempts.set(attempt.signature, attempt);
    }
  } catch {
    // Unreadable: start empty. The server still rejects a conflicting checkout.
  }
}

/** Web storage is synchronous, so a reloaded tab sees its attempts on the first read. */
function hydrateWeb() {
  if (Platform.OS !== 'web' || loadPromise) return;
  loadPromise = Promise.resolve();
  try {
    remember(webStorage()?.getItem(STORAGE_KEY) ?? null);
  } catch {
    // Unreadable: start empty.
  }
}

function ensureLoaded(): Promise<void> {
  hydrateWeb();
  if (loadPromise) return loadPromise;
  const gen = generation;
  loadPromise = (async () => {
    let raw: string | null = null;
    try {
      raw = await attemptStorage().getItem(STORAGE_KEY);
    } catch {
      raw = null;
    }
    if (gen !== generation) return;
    remember(raw);
  })();
  return loadPromise;
}

type AttemptStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<unknown>;
  removeItem: (key: string) => Promise<unknown>;
};

/** The package is CJS. Jest's mock has no `default`, so accept either shape. */
function attemptStorage(): AttemptStorage {
  // require (not import()) so Jest's module mock is the same store the tests read.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const imported = require('@react-native-async-storage/async-storage') as AttemptStorage & {
    default?: AttemptStorage;
  };
  return imported.default?.getItem ? imported.default : imported;
}

function enqueueWrite(task: () => Promise<void>): Promise<void> {
  const run = writeQueue.then(task, task);
  writeQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

/** Writes the attempts as they are now. Callers await this before a request that must not be lost. */
function persist(): Promise<void> {
  const payload = JSON.stringify([...attempts.values()]);
  return enqueueWrite(async () => {
    if (Platform.OS === 'web') {
      try {
        webStorage()?.setItem(STORAGE_KEY, payload);
      } catch {
        // Storage full or blocked: memory still holds the attempts for this page.
      }
      return;
    }
    try {
      await attemptStorage().setItem(STORAGE_KEY, payload);
    } catch {
      // Storage unavailable: memory still holds the attempts for this process.
    }
  });
}

function persistCleared(): Promise<void> {
  return enqueueWrite(async () => {
    if (Platform.OS === 'web') {
      try {
        webStorage()?.removeItem(STORAGE_KEY);
      } catch {
        // Nothing to clear.
      }
      return;
    }
    try {
      await attemptStorage().removeItem(STORAGE_KEY);
    } catch {
      // Nothing to clear.
    }
  });
}

function prune(now: number) {
  let changed = false;
  for (const [signature, attempt] of attempts) {
    if (now - attempt.createdAt > CHECKOUT_ATTEMPT_MAX_AGE_MS) {
      attempts.delete(signature);
      changed = true;
    }
  }
  if (changed) void persist();
}

/** Same purchase even if object keys or feature-key lists were built in a different order. */
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) {
    const items = value.map(canonical);
    if (items.every((item) => typeof item === 'string')) return [...(items as string[])].sort();
    return items;
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .sort()
        .filter((k) => (value as Record<string, unknown>)[k] !== undefined)
        .map((k) => [k, canonical((value as Record<string, unknown>)[k])])
    );
  }
  return value;
}

/** Stable signature for a purchase: the same params always give the same string. */
export function checkoutSignature(estateId: string, params: Record<string, unknown>): string {
  return `${estateId}|${JSON.stringify(canonical(params))}`;
}

/**
 * The body that will be posted for this purchase. Feature-key order is not part of the purchase,
 * so two taps that select the same tools in a different order stay one checkout.
 */
export function stableCheckoutParams<T extends { ai_feature_keys?: string[] }>(params: T): T {
  if (!params.ai_feature_keys) return params;
  return { ...params, ai_feature_keys: [...params.ai_feature_keys].sort() };
}

export function getCheckoutAttempt(signature: string, now = Date.now()): CheckoutAttempt | null {
  hydrateWeb();
  prune(now);
  return attempts.get(signature) ?? null;
}

/**
 * The attempt for this purchase, created synchronously when there is none, so two taps (or two
 * screens) starting the same purchase at once share one Idempotency-Key and so one session.
 */
export async function getOrCreateCheckoutAttempt(
  signature: string,
  estateId: string,
  now = Date.now()
): Promise<CheckoutAttempt> {
  await ensureLoaded();
  const existing = getCheckoutAttempt(signature, now);
  if (existing) return existing;
  const attempt: CheckoutAttempt = {
    signature,
    estateId,
    key: createIdempotencyKey(),
    createdAt: now,
  };
  attempts.set(signature, attempt);
  // On disk before initialize, so a killed app retries this key instead of opening another session.
  await persist();
  return attempt;
}

/** A definitive end (failed/expired, or the server refused the key): the next try is new. */
export async function renewCheckoutAttempt(signature: string, estateId: string, now = Date.now()) {
  attempts.delete(signature);
  return getOrCreateCheckoutAttempt(signature, estateId, now);
}

export async function recordCheckoutSession(signature: string, session: CheckoutAttemptSession) {
  const attempt = attempts.get(signature);
  if (!attempt) return;
  const sameSession = attempt.session?.reference === session.reference;
  attempts.set(signature, { ...attempt, session, submitted: sameSession && attempt.submitted });
  await persist();
}

/** Paystack redirected back for this reference: the payment was submitted. */
export async function markCheckoutSubmitted(reference: string) {
  await ensureLoaded();
  let changed = false;
  for (const [signature, attempt] of attempts) {
    if (attempt.session?.reference === reference) {
      attempts.set(signature, { ...attempt, submitted: true });
      changed = true;
    }
  }
  if (changed) await persist();
}

/**
 * What POST /checkout/cancel reported. `paid` means Paystack had already taken the money, so the
 * cancel did not undo it. Anything other than a documented terminal status stays unresolved.
 */
export function interpretCheckoutCancel(status: string): 'paid' | 'cancelled' | 'ended' | 'open' {
  if (status === 'paid') return 'paid';
  if (status === 'cancelled') return 'cancelled';
  if (status === 'failed' || status === 'expired') return 'ended';
  return 'open';
}

/** The attempt is settled (paid, failed, expired, or cancelled): forget it. */
export async function finishCheckoutAttempt(reference: string) {
  await ensureLoaded();
  let changed = false;
  for (const [signature, attempt] of attempts) {
    if (attempt.session?.reference === reference) {
      attempts.delete(signature);
      changed = true;
    }
  }
  if (changed) await persist();
}

/** Another purchase for this estate whose session may still be open (it would conflict). */
export function findOpenCheckoutAttempt(
  estateId: string,
  exceptSignature: string,
  now = Date.now()
): CheckoutAttempt | null {
  hydrateWeb();
  prune(now);
  for (const attempt of attempts.values()) {
    if (attempt.estateId === estateId && attempt.signature !== exceptSignature) return attempt;
  }
  return null;
}

/** Sign-out: attempts belong to the account that is leaving. Memory drops immediately. */
export function clearCheckoutAttempts(): Promise<void> {
  generation += 1;
  attempts.clear();
  loadPromise = Promise.resolve();
  return persistCleared();
}

/**
 * Decide how to (re)start the checkout for `signature`, checking the previous session with the
 * server first. Never returns `initialize` with a new key while an earlier session for the same
 * purchase might still be paid or in progress.
 */
export async function prepareCheckoutAttempt(
  signature: string,
  estateId: string,
  fetchStatus: StatusFetcher,
  now = Date.now()
): Promise<CheckoutAttemptDecision> {
  await ensureLoaded();
  const existing = getCheckoutAttempt(signature, now);
  const attempt = existing ?? (await getOrCreateCheckoutAttempt(signature, estateId, now));
  // No session yet: brand new, or initialize never answered (timeout). Re-sending the same key is
  // safe either way: the server returns the session it created, if it created one.
  if (!attempt.session) return { kind: 'initialize', key: attempt.key, replay: Boolean(existing) };

  let status: CheckoutSessionStatus;
  try {
    ({ status } = await fetchStatus(attempt.session.reference, attempt.session.token));
  } catch {
    return { kind: 'unknown' };
  }

  if (status === 'paid') return { kind: 'paid', session: attempt.session };
  if (status === 'pending') {
    if (attempt.submitted) return { kind: 'processing', session: attempt.session };
    // Closed before paying: reopen the same session rather than start a second one.
    return { kind: 'initialize', key: attempt.key, replay: true };
  }
  if (status === 'failed' || status === 'expired' || status === 'cancelled') {
    // Definitively over: a new attempt with a new key. Replaying a dead key returns 409.
    const fresh = await renewCheckoutAttempt(signature, estateId, now);
    return { kind: 'initialize', key: fresh.key, replay: false };
  }
  // A status this app does not know: never assume it ended.
  return { kind: 'unknown' };
}

type InitializedSession = {
  paystack_reference: string;
  checkout_token: string;
  authorization_url: string;
};

/**
 * POST /checkout/initialize for an attempt, following the API's Idempotency-Key rules:
 * - success: the session is recorded on the attempt;
 * - 409 on a replayed key: that session has failed or expired, so retry once with a fresh key;
 * - 409 / 422 otherwise: the server settled the request, so the next try gets a fresh key;
 * - anything else (timeout, network, 5xx): the key is kept, because the server may have created a
 *   session and re-sending the same key returns it instead of charging twice.
 * Errors are rethrown for the caller to show.
 */
export async function initializeCheckoutAttempt<T extends InitializedSession>(
  signature: string,
  estateId: string,
  decision: { key: string; replay: boolean },
  initialize: (idempotencyKey: string) => Promise<T>,
  readStatus: (error: unknown) => number | undefined
): Promise<T> {
  let { key, replay } = decision;
  for (;;) {
    try {
      const session = await initialize(key);
      await recordCheckoutSession(signature, {
        reference: session.paystack_reference,
        token: session.checkout_token,
        authorizationUrl: session.authorization_url,
      });
      return session;
    } catch (error) {
      const status = readStatus(error);
      if (status === 409 && replay) {
        ({ key } = await renewCheckoutAttempt(signature, estateId));
        replay = false;
        continue;
      }
      if (status === 409 || status === 422) await renewCheckoutAttempt(signature, estateId);
      throw error;
    }
  }
}

/** Test helper. Drops memory and the persisted attempts. */
export async function __resetCheckoutAttemptsForTests() {
  generation += 1;
  attempts.clear();
  loadPromise = Promise.resolve();
  await persistCleared();
}

/** Test helper. Drops memory only, as an app restart would, leaving stored attempts in place. */
export function __forgetCheckoutAttemptsMemoryForTests() {
  generation += 1;
  attempts.clear();
  loadPromise = null;
}
