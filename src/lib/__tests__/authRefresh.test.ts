// Modules are re-required after jest.resetModules() so each test gets fresh interceptors and state.
/* eslint-disable @typescript-eslint/no-require-imports */
import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const mockSecureStore = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockSecureStore.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockSecureStore.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockSecureStore.delete(key);
  }),
}));

jest.mock('@/src/lib/deviceId', () => ({
  attachDeviceId: (config: unknown) => config,
}));

const USER_URL = 'https://user.test';
process.env.EXPO_PUBLIC_USER_SERVICE_API_URL = USER_URL;
process.env.EXPO_PUBLIC_CODE_SERVICE_API_URL = 'https://code.test';
process.env.EXPO_PUBLIC_REVENUE_SERVICE_API_URL = 'https://revenue.test';

/** An unsigned JWT whose `exp` is `secondsFromNow` away; enough for the client-side decode. */
const jwt = (name: string, secondsFromNow = 30 * 60) => {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + secondsFromNow;
  return `${encode({ alg: 'HS256' })}.${encode({ exp, name })}.sig`;
};

type Reply = { status: number; data?: unknown } | 'network-error';
type Handler = (config: InternalAxiosRequestConfig) => Reply | Promise<Reply>;

function loadModules(handler: Handler) {
  jest.resetModules();
  const axios = require('axios');
  const calls: InternalAxiosRequestConfig[] = [];

  const adapter: AxiosAdapter = async (config) => {
    calls.push(config);
    const reply = await handler(config);
    if (reply === 'network-error') {
      throw new axios.AxiosError('Network Error', 'ERR_NETWORK', config);
    }
    const response = {
      data: reply.data ?? {},
      status: reply.status,
      statusText: '',
      headers: {},
      config,
    };
    if (reply.status >= 400) {
      throw new axios.AxiosError(
        `Request failed with status code ${reply.status}`,
        'ERR_BAD_REQUEST',
        config,
        null,
        response
      );
    }
    return response;
  };
  // Set before the modules below create their instances, which copy the defaults.
  axios.defaults.adapter = adapter;

  const Api = require('@/src/lib/api').default;
  const session = require('@/src/lib/session');
  const helpers = require('@/src/lib/helpers');
  const authRefresh = require('@/src/lib/authRefresh');
  const { useAuthStore } = require('@/src/lib/stores/authStore');

  const onUnauthorized = jest.fn();
  session.setUnauthorizedHandler(onUnauthorized);

  const refreshCalls = () => calls.filter((c) => c.url?.endsWith('/auth/refresh'));
  const authOf = (config: InternalAxiosRequestConfig) => config.headers?.get?.('Authorization');

  return {
    axios,
    Api,
    helpers,
    authRefresh,
    useAuthStore,
    onUnauthorized,
    calls,
    refreshCalls,
    authOf,
  };
}

const A1 = jwt('a1');
const A2 = jwt('a2');

const refreshOk: Reply = {
  status: 200,
  data: {
    success: true,
    role: 'resident',
    access_token: A2,
    refresh_token: 'r2',
    session_id: 's1',
  },
};

/** Protected endpoint that accepts only A2; refresh succeeds after a short delay. */
const rotatingServer =
  (refreshReply: Reply = refreshOk): Handler =>
  async (config) => {
    if (config.url?.endsWith('/auth/refresh')) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return refreshReply;
    }
    return config.headers.get('Authorization') === `Bearer ${A2}`
      ? { status: 200, data: { ok: true } }
      : { status: 401, data: { detail: 'Token expired' } };
  };

const signIn = async (
  m: ReturnType<typeof loadModules>,
  refresh_token: string | null = 'r1',
  access_token = A1
) => {
  await m.helpers.storeAuthState({
    access_token,
    refresh_token,
    role: 'resident',
    session_id: 's1',
  });
  m.useAuthStore.setState({ access_token, refresh_token, role: 'resident', session_id: 's1' });
};

afterEach(() => {
  mockSecureStore.clear();
});

it('runs exactly one refresh for concurrent 401s and retries every request', async () => {
  const m = loadModules(rotatingServer());
  await signIn(m);

  const results = await Promise.all([
    m.Api().get('/things/1'),
    m.Api().get('/things/2'),
    m.Api('code').get('/things/3'),
  ]);

  expect(results.map((r: { status: number }) => r.status)).toEqual([200, 200, 200]);
  expect(m.refreshCalls()).toHaveLength(1);
  expect(JSON.parse(m.refreshCalls()[0].data)).toEqual({ refresh_token: 'r1' });
  expect(m.useAuthStore.getState()).toMatchObject({ access_token: A2, refresh_token: 'r2' });
  await expect(m.helpers.getAuthState()).resolves.toMatchObject({
    access_token: A2,
    refresh_token: 'r2',
    session_id: 's1',
  });
  expect(m.onUnauthorized).not.toHaveBeenCalled();
});

it('resends a late 401 with the already-rotated token instead of refreshing again', async () => {
  const m = loadModules(rotatingServer());
  await signIn(m);
  // Built before the rotation, so it still carries A1.
  const staleClient = m.Api();

  await m.Api().get('/things/1');
  const late = await staleClient.get('/things/2');

  expect(late.status).toBe(200);
  expect(m.refreshCalls()).toHaveLength(1);
  // The request interceptor already swapped the superseded token before sending.
  expect(m.authOf(m.calls[m.calls.length - 1])).toBe(`Bearer ${A2}`);
});

it('signs out when the server refuses the refresh token', async () => {
  const m = loadModules(
    rotatingServer({ status: 401, data: { detail: 'Refresh token has expired.' } })
  );
  await signIn(m);

  const outcomes = await Promise.allSettled([m.Api().get('/things/1'), m.Api().get('/things/2')]);

  expect(outcomes.every((o) => o.status === 'rejected')).toBe(true);
  expect(m.refreshCalls()).toHaveLength(1);
  expect(m.onUnauthorized).toHaveBeenCalledTimes(1);

  // The rejected token is never sent again (it would count as reuse).
  await expect(m.Api().get('/things/3')).rejects.toMatchObject({ response: { status: 401 } });
  expect(m.refreshCalls()).toHaveLength(1);
});

it('keeps the session on a transient refresh failure', async () => {
  const m = loadModules(rotatingServer('network-error'));
  await signIn(m);

  await expect(m.Api().get('/things/1')).rejects.toMatchObject({ response: { status: 401 } });

  expect(m.refreshCalls()).toHaveLength(1);
  expect(m.onUnauthorized).not.toHaveBeenCalled();
  expect(m.useAuthStore.getState()).toMatchObject({ access_token: A1, refresh_token: 'r1' });
});

it('neither refreshes nor signs out on a 401 from an exempt path', async () => {
  const m = loadModules(() => ({ status: 401, data: { detail: 'Invalid TOTP code.' } }));
  await signIn(m);

  await expect(m.Api().post('/auth/2fa/enable', { code: '000000' })).rejects.toMatchObject({
    response: { status: 401 },
  });

  expect(m.refreshCalls()).toHaveLength(0);
  expect(m.onUnauthorized).not.toHaveBeenCalled();
});

it('passes a 403 through untouched', async () => {
  const m = loadModules(() => ({ status: 403, data: { detail: 'ID not approved' } }));
  await signIn(m);

  await expect(m.Api('revenue').get('/entitlements/estate/e1')).rejects.toMatchObject({
    response: { status: 403, data: { detail: 'ID not approved' } },
  });
  expect(m.refreshCalls()).toHaveLength(0);
  expect(m.onUnauthorized).not.toHaveBeenCalled();
});

it('refreshes before sending when the access token is about to expire', async () => {
  const m = loadModules(rotatingServer());
  await signIn(m, 'r1', jwt('a1-expiring', 30));

  const response = await m.Api().get('/things/1');

  expect(response.status).toBe(200);
  expect(m.refreshCalls()).toHaveLength(1);
  // Only the refresh and one request: no 401 round trip.
  expect(m.calls).toHaveLength(2);
  expect(m.authOf(m.calls[1])).toBe(`Bearer ${A2}`);
});

it('signs a legacy session (no refresh token) out on a 401, as before', async () => {
  const m = loadModules(rotatingServer());
  await signIn(m, null);

  await expect(m.Api().get('/things/1')).rejects.toMatchObject({ response: { status: 401 } });

  expect(m.refreshCalls()).toHaveLength(0);
  expect(m.onUnauthorized).toHaveBeenCalledTimes(1);
});

it('leaves requests that carry a different token alone', async () => {
  const m = loadModules(() => ({ status: 401 }));
  await signIn(m);

  await expect(
    m.axios.post(
      `${USER_URL}/api/v1/auth/biometric/enable`,
      {},
      {
        headers: { Authorization: 'Bearer tos-pending-token' },
      }
    )
  ).rejects.toMatchObject({ response: { status: 401 } });

  expect(m.authOf(m.calls[0])).toBe('Bearer tos-pending-token');
  expect(m.refreshCalls()).toHaveLength(0);
  expect(m.onUnauthorized).not.toHaveBeenCalled();
});

it('refreshes session tokens on direct axios calls too', async () => {
  const m = loadModules(rotatingServer());
  await signIn(m);

  const response = await m.axios.delete(`${USER_URL}/api/v1/auth/biometric`, {
    headers: { Authorization: `Bearer ${A1}` },
  });

  expect(response.status).toBe(200);
  expect(m.refreshCalls()).toHaveLength(1);
});

it('adopts a pair another tab already rotated instead of reusing the old refresh token', async () => {
  const m = loadModules(rotatingServer());
  const nav = globalThis.navigator as unknown as { locks?: unknown };
  nav.locks = { request: (_name: string, callback: () => Promise<unknown>) => callback() };
  try {
    await signIn(m, 'r1', jwt('a1-expiring', 30));
    // Another tab rotated and saved the new pair.
    await m.helpers.storeAuthState({
      access_token: A2,
      refresh_token: 'r2',
      role: 'resident',
      session_id: 's1',
    });

    const response = await m.Api().get('/things/1');

    expect(response.status).toBe(200);
    expect(m.refreshCalls()).toHaveLength(0);
    expect(m.useAuthStore.getState()).toMatchObject({ access_token: A2, refresh_token: 'r2' });
  } finally {
    delete nav.locks;
  }
});

it('on web without Web Locks, still adopts a pair another tab already rotated', async () => {
  // The modules loadModules re-requires see a web Platform.
  jest.doMock('react-native', () => {
    const actual = jest.requireActual('react-native');
    Object.defineProperty(actual.Platform, 'OS', { configurable: true, get: () => 'web' });
    return actual;
  });
  // Hide the Web Locks API (recent Node versions provide one).
  const nav = globalThis.navigator as unknown as { locks?: unknown };
  Object.defineProperty(nav, 'locks', { configurable: true, value: undefined });
  try {
    const m = loadModules(rotatingServer());
    await signIn(m, 'r1', jwt('a1-expiring', 30));
    // Another tab rotated and saved the new pair (web keeps it all in the shared localStorage).
    await m.helpers.storeAuthState({
      access_token: A2,
      refresh_token: 'r2',
      role: 'resident',
      session_id: 's1',
    });

    const response = await m.Api().get('/things/1');

    expect(response.status).toBe(200);
    expect(m.refreshCalls()).toHaveLength(0);
    expect(m.useAuthStore.getState()).toMatchObject({ access_token: A2, refresh_token: 'r2' });
  } finally {
    jest.dontMock('react-native');
    delete nav.locks;
  }
});

it('keeps the refresh token out of the AsyncStorage blob on native', async () => {
  const m = loadModules(rotatingServer());
  const AsyncStorage = require('@react-native-async-storage/async-storage');
  await signIn(m);

  expect(JSON.parse(await AsyncStorage.getItem('auth-key'))).not.toHaveProperty('refresh_token');
  await expect(m.helpers.getAuthState()).resolves.toMatchObject({ refresh_token: 'r1' });

  await m.helpers.clearAuthState();
  expect(mockSecureStore.size).toBe(0);
});

it('reads the expiry of a JWT and treats unreadable tokens as not expiring', () => {
  const m = loadModules(rotatingServer());
  expect(m.authRefresh.isTokenExpiringSoon(jwt('soon', 30))).toBe(true);
  expect(m.authRefresh.isTokenExpiringSoon(jwt('later', 600))).toBe(false);
  expect(m.authRefresh.isTokenExpiringSoon('not-a-jwt')).toBe(false);
});
