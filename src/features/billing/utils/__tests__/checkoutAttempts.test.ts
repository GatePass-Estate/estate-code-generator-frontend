/* eslint-disable @typescript-eslint/no-require-imports */
import {
  __forgetCheckoutAttemptsMemoryForTests,
  __resetCheckoutAttemptsForTests,
  CHECKOUT_ATTEMPT_MAX_AGE_MS,
  checkoutSignature,
  clearCheckoutAttempts,
  findOpenCheckoutAttempt,
  finishCheckoutAttempt,
  getCheckoutAttempt,
  getOrCreateCheckoutAttempt,
  initializeCheckoutAttempt,
  interpretCheckoutCancel,
  markCheckoutSubmitted,
  prepareCheckoutAttempt,
} from '@/src/features/billing/utils/checkoutAttempts';
import type { CheckoutSessionStatus } from '@/src/features/billing/types/billing';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const ESTATE = 'estate-1';
const PURCHASE = { checkout_kind: 'seat_add', seats_added: 5 };
const SIG = checkoutSignature(ESTATE, PURCHASE);

type Session = { paystack_reference: string; checkout_token: string; authorization_url: string };
const session = (ref: string): Session => ({
  paystack_reference: ref,
  checkout_token: `tok-${ref}`,
  authorization_url: `https://checkout.paystack.com/${ref}`,
});

class HttpError extends Error {
  constructor(readonly status?: number) {
    super(`http ${status ?? 'network'}`);
  }
}
const statusOf = (error: unknown) => (error as HttpError).status;

const statusIs = (status: CheckoutSessionStatus) => jest.fn(async () => ({ status }));

/**
 * A fake revenue service that follows the documented Idempotency-Key contract: the same key
 * returns the same session while it is open, and 409 once it has failed or expired.
 */
function fakeServer() {
  const sessionsByKey = new Map<string, Session & { status: CheckoutSessionStatus }>();
  let n = 0;
  const initialize = jest.fn(async (key: string): Promise<Session> => {
    const existing = sessionsByKey.get(key);
    if (existing) {
      if (
        existing.status === 'failed' ||
        existing.status === 'expired' ||
        existing.status === 'cancelled'
      ) {
        throw new HttpError(409);
      }
      return existing;
    }
    n += 1;
    const created = { ...session(`ref-${n}`), status: 'pending' as CheckoutSessionStatus };
    sessionsByKey.set(key, created);
    return created;
  });
  const fetchStatus = jest.fn(async (reference: string) => {
    for (const s of sessionsByKey.values()) {
      if (s.paystack_reference === reference) return { status: s.status };
    }
    throw new HttpError(404);
  });
  const setStatus = (reference: string, status: CheckoutSessionStatus) => {
    for (const s of sessionsByKey.values())
      if (s.paystack_reference === reference) s.status = status;
  };
  return { initialize, fetchStatus, setStatus, sessionsByKey };
}

/** One "Pay" press: decide, then initialize if the decision says so. */
async function pay(server: ReturnType<typeof fakeServer>, now = Date.now()) {
  const decision = await prepareCheckoutAttempt(SIG, ESTATE, server.fetchStatus, now);
  if (decision.kind !== 'initialize') return { decision };
  const result = await initializeCheckoutAttempt(
    SIG,
    ESTATE,
    decision,
    server.initialize,
    statusOf
  );
  return { decision, session: result };
}

beforeEach(async () => {
  await __resetCheckoutAttemptsForTests();
});

describe('checkout cancel result', () => {
  it('trusts a paid status even when cancellation was requested', () => {
    expect(interpretCheckoutCancel('paid')).toBe('paid');
    expect(interpretCheckoutCancel('cancelled')).toBe('cancelled');
    expect(interpretCheckoutCancel('expired')).toBe('ended');
    expect(interpretCheckoutCancel('failed')).toBe('ended');
    expect(interpretCheckoutCancel('pending')).toBe('open');
    expect(interpretCheckoutCancel('processing')).toBe('open');
  });
});

describe('checkout attempts', () => {
  it('successful payment: the attempt is finished and the next purchase is new', async () => {
    const server = fakeServer();
    const first = await pay(server);
    expect(first.session?.paystack_reference).toBe('ref-1');

    server.setStatus('ref-1', 'paid');
    await finishCheckoutAttempt('ref-1');
    expect(getCheckoutAttempt(SIG)).toBeNull();

    const second = await pay(server);
    expect(second.session?.paystack_reference).toBe('ref-2');
  });

  it('failed payment: retry starts a new session with a new key', async () => {
    const server = fakeServer();
    await pay(server);
    const firstKey = getCheckoutAttempt(SIG)!.key;
    server.setStatus('ref-1', 'failed');

    const retry = await pay(server);
    expect(retry.session?.paystack_reference).toBe('ref-2');
    expect(getCheckoutAttempt(SIG)!.key).not.toBe(firstKey);
  });

  it('an unfinished pending checkout is reopened instead of starting a second one', async () => {
    const server = fakeServer();
    await pay(server); // app closed before cancel; the session is still pending

    const retry = await pay(server);
    expect(retry.decision).toMatchObject({ kind: 'initialize', replay: true });
    expect(retry.session?.paystack_reference).toBe('ref-1');
    expect(server.sessionsByKey.size).toBe(1); // no second checkout was created
  });

  it('a cancelled checkout gets a new key and a new session', async () => {
    const server = fakeServer();
    await pay(server);
    server.setStatus('ref-1', 'cancelled');

    const retry = await pay(server);
    expect(retry.decision).toMatchObject({ kind: 'initialize', replay: false });
    expect(retry.session?.paystack_reference).toBe('ref-2');
  });

  it('expired checkout then retry: the stale key gets a fresh one and a new session', async () => {
    const server = fakeServer();
    await pay(server);
    server.setStatus('ref-1', 'expired');

    const retry = await pay(server);
    expect(retry.decision).toMatchObject({ kind: 'initialize', replay: false });
    expect(retry.session?.paystack_reference).toBe('ref-2');
  });

  it('a replayed key that the server now refuses (409) is renewed once and succeeds', async () => {
    const server = fakeServer();
    await pay(server);
    // The status check still said pending, but the session expired before the replay arrived.
    const fetchPending = statusIs('pending');
    const decision = await prepareCheckoutAttempt(SIG, ESTATE, fetchPending);
    server.setStatus('ref-1', 'expired');

    const result = await initializeCheckoutAttempt(
      SIG,
      ESTATE,
      decision as never,
      server.initialize,
      statusOf
    );
    expect(result.paystack_reference).toBe('ref-2');
    expect(server.initialize).toHaveBeenCalledTimes(3); // first pay, refused replay, fresh key
  });

  it('repeated taps / concurrent starts share one key and so one session', async () => {
    const server = fakeServer();
    const [a, b] = await Promise.all([pay(server), pay(server)]);
    expect(a.session?.paystack_reference).toBe('ref-1');
    expect(b.session?.paystack_reference).toBe('ref-1');
    expect(new Set(server.initialize.mock.calls.map(([key]) => key)).size).toBe(1);
  });

  it('network timeout during initialization keeps the key, so the retry gets the created session', async () => {
    const server = fakeServer();
    const decision = await prepareCheckoutAttempt(SIG, ESTATE, server.fetchStatus);
    if (decision.kind !== 'initialize') throw new Error('expected initialize');
    // The server created the session but the response never arrived.
    const timingOut = jest.fn(async (key: string) => {
      await server.initialize(key);
      throw new HttpError(undefined);
    });
    await expect(
      initializeCheckoutAttempt(SIG, ESTATE, decision, timingOut, statusOf)
    ).rejects.toThrow();

    const retry = await pay(server);
    expect(retry.decision).toMatchObject({ kind: 'initialize', key: decision.key, replay: true });
    expect(retry.session?.paystack_reference).toBe('ref-1');
    expect(server.sessionsByKey.size).toBe(1);
  });

  it('payment succeeded but the app never heard back: retry shows paid, no second charge', async () => {
    const server = fakeServer();
    await pay(server);
    server.setStatus('ref-1', 'paid'); // e.g. the redirect was lost, the webhook landed later

    const retry = await pay(server);
    expect(retry.decision).toMatchObject({ kind: 'paid' });
    expect(server.initialize).toHaveBeenCalledTimes(1);
  });

  it('submitted and still pending (delayed webhook / timeout after submission): shows processing', async () => {
    const server = fakeServer();
    await pay(server);
    await markCheckoutSubmitted('ref-1');

    const retry = await pay(server);
    expect(retry.decision).toMatchObject({ kind: 'processing' });
    expect(server.initialize).toHaveBeenCalledTimes(1);

    // The webhook finally lands: the next try reports it paid.
    server.setStatus('ref-1', 'paid');
    expect((await pay(server)).decision).toMatchObject({ kind: 'paid' });
  });

  it('status of the previous attempt cannot be read: does not start another charge', async () => {
    const server = fakeServer();
    await pay(server);
    const offline = jest.fn(async () => {
      throw new HttpError(undefined);
    });
    expect(await prepareCheckoutAttempt(SIG, ESTATE, offline)).toEqual({ kind: 'unknown' });
  });

  it('an unrecognised status is not treated as finished', async () => {
    const server = fakeServer();
    await pay(server);
    const odd = jest.fn(async () => ({ status: 'abandoned' as CheckoutSessionStatus }));
    expect(await prepareCheckoutAttempt(SIG, ESTATE, odd)).toEqual({ kind: 'unknown' });
  });

  it('409/422 on a fresh key renews the attempt; other errors keep it', async () => {
    const decision = await prepareCheckoutAttempt(SIG, ESTATE, statusIs('pending'));
    if (decision.kind !== 'initialize') throw new Error('expected initialize');
    const conflict = jest.fn(async () => {
      throw new HttpError(409);
    });
    await expect(
      initializeCheckoutAttempt(SIG, ESTATE, decision, conflict, statusOf)
    ).rejects.toThrow();
    expect(conflict).toHaveBeenCalledTimes(1); // a fresh key's 409 is a real conflict: no retry
    expect(getCheckoutAttempt(SIG)!.key).not.toBe(decision.key);

    const keyAfter = getCheckoutAttempt(SIG)!.key;
    const serverError = jest.fn(async () => {
      throw new HttpError(503);
    });
    await expect(
      initializeCheckoutAttempt(
        SIG,
        ESTATE,
        { key: keyAfter, replay: false },
        serverError,
        statusOf
      )
    ).rejects.toThrow();
    expect(getCheckoutAttempt(SIG)!.key).toBe(keyAfter);
  });

  it('existing pending checkout for a different purchase is found (conflict explanation)', async () => {
    const server = fakeServer();
    await pay(server);
    const other = checkoutSignature(ESTATE, { checkout_kind: 'renew', period_months: 12 });
    expect(findOpenCheckoutAttempt(ESTATE, other)?.signature).toBe(SIG);
    expect(findOpenCheckoutAttempt('another-estate', other)).toBeNull();
  });

  it('old attempts expire with the checkout token and do not leak into a new attempt', async () => {
    const server = fakeServer();
    const start = Date.now();
    await pay(server, start);
    const later = start + CHECKOUT_ATTEMPT_MAX_AGE_MS + 1;
    expect(getCheckoutAttempt(SIG, later)).toBeNull();
    const fresh = await pay(server, later);
    expect(fresh.decision).toMatchObject({ kind: 'initialize', replay: false });
    expect(fresh.session?.paystack_reference).toBe('ref-2');
  });

  it('different purchases never share a key; the same purchase always does', async () => {
    const a = await getOrCreateCheckoutAttempt(SIG, ESTATE);
    const b = await getOrCreateCheckoutAttempt(
      checkoutSignature(ESTATE, { ...PURCHASE, seats_added: 6 }),
      ESTATE
    );
    expect(a.key).not.toBe(b.key);
    expect(checkoutSignature(ESTATE, { seats_added: 5, checkout_kind: 'seat_add' })).toBe(SIG);
    expect((await getOrCreateCheckoutAttempt(SIG, ESTATE)).key).toBe(a.key);
    expect(
      checkoutSignature(ESTATE, { checkout_kind: 'ai_only', ai_feature_keys: ['b', 'a'] })
    ).toBe(checkoutSignature(ESTATE, { ai_feature_keys: ['a', 'b'], checkout_kind: 'ai_only' }));
  });

  it('an app restart keeps the attempt, so the retry reopens that session', async () => {
    const server = fakeServer();
    await pay(server);
    const key = getCheckoutAttempt(SIG)!.key;
    __forgetCheckoutAttemptsMemoryForTests();
    expect(getCheckoutAttempt(SIG)).toBeNull();

    const retry = await pay(server);
    expect(retry.decision).toMatchObject({ kind: 'initialize', replay: true });
    expect(retry.session?.paystack_reference).toBe('ref-1');
    expect(getCheckoutAttempt(SIG)!.key).toBe(key);
    expect(server.sessionsByKey.size).toBe(1);
  });

  it('sign-out clears every attempt', async () => {
    await pay(fakeServer());
    await clearCheckoutAttempts();
    expect(getCheckoutAttempt(SIG)).toBeNull();
  });
});

describe('checkout attempts on web', () => {
  it('survive a full page load (the tab leaves for Paystack and comes back)', async () => {
    const store = new Map<string, string>();
    const sessionStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    };
    const globalWithWindow = globalThis as unknown as { window?: unknown };
    const previousWindow = globalWithWindow.window;
    globalWithWindow.window = { sessionStorage };
    try {
      let key = '';
      let saved: Promise<void> = Promise.resolve();
      jest.isolateModules(() => {
        jest.doMock('react-native', () => ({ Platform: { OS: 'web' } }));
        jest.doMock('@/src/features/billing/utils/billing', () => ({
          createIdempotencyKey: () => `key-${Math.random()}`,
        }));
        const m = require('@/src/features/billing/utils/checkoutAttempts');
        saved = m.getOrCreateCheckoutAttempt(SIG, ESTATE).then(async (attempt: { key: string }) => {
          key = attempt.key;
          await m.recordCheckoutSession(SIG, {
            reference: 'ref-web',
            token: 't',
            authorizationUrl: 'u',
          });
        });
      });
      await saved;
      jest.isolateModules(() => {
        jest.doMock('react-native', () => ({ Platform: { OS: 'web' } }));
        jest.doMock('@/src/features/billing/utils/billing', () => ({
          createIdempotencyKey: () => `key-${Math.random()}`,
        }));
        const m = require('@/src/features/billing/utils/checkoutAttempts');
        const reloaded = m.getCheckoutAttempt(SIG);
        expect(reloaded?.key).toBe(key);
        expect(reloaded?.session?.reference).toBe('ref-web');
      });
    } finally {
      globalWithWindow.window = previousWindow;
      jest.dontMock('react-native');
      jest.dontMock('@/src/features/billing/utils/billing');
    }
  });
});
