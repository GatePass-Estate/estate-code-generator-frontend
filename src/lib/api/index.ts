import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore';
import { handleUnauthorizedResponse, shouldForceLogoutOn401 } from '../session';
import { errorDetail, signOutReasonFromRequestFailure } from '../signOutReason';
import { attachDeviceId } from '../deviceId';
import { getValidAccessToken, isOwnAccessToken, refreshSession } from '../authRefresh';

type Service = 'user' | 'code' | 'ai' | 'revenue';

const SERVICE_URLS: Record<Service, string | undefined> = {
  user: process.env.EXPO_PUBLIC_USER_SERVICE_API_URL,
  code: process.env.EXPO_PUBLIC_CODE_SERVICE_API_URL,
  ai: process.env.EXPO_PUBLIC_AI_SERVICE_API_URL,
  revenue: process.env.EXPO_PUBLIC_REVENUE_SERVICE_API_URL,
};

type AuthRequestConfig = InternalAxiosRequestConfig & {
  /** Set when the Authorization header carries this session's token (we may swap it). */
  _sessionAuth?: boolean;
  /** Set once the request has been retried after a refresh. */
  _authRetried?: boolean;
};

const bearerOf = (config: InternalAxiosRequestConfig): string | null => {
  const header = config.headers?.get?.('Authorization');
  if (typeof header !== 'string') return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1] : null;
};

/**
 * Request side: a request carrying this session's token (possibly one captured before a
 * rotation) gets a valid token at send time, refreshing first when it is about to expire.
 * Requests that deliberately carry another token (ToS-pending, 2FA-pending, or the token
 * of a sign-in still being completed) are left alone. `addWhenMissing` is only for Api()
 * clients, which always talk to our services; global axios calls without a header stay
 * without one.
 */
function sessionTokenRequestInterceptor(addWhenMissing: boolean) {
  return async (config: InternalAxiosRequestConfig) => {
    const authConfig = config as AuthRequestConfig;
    const sent = bearerOf(config);
    const ours = sent ? isOwnAccessToken(sent) : addWhenMissing;
    if (!ours) return config;

    const token = await getValidAccessToken();
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
      authConfig._sessionAuth = true;
    }
    return config;
  };
}

/**
 * Response side: a 401 on a session request refreshes once (shared with any concurrent
 * 401s) and retries with the new token. Sessions without a refresh token, a second 401,
 * or a refused refresh sign out as before; a transient refresh failure just rejects.
 */
function sessionUnauthorizedInterceptor(client: AxiosInstance) {
  return async (error: AxiosError) => {
    const config = error.config as AuthRequestConfig | undefined;
    const requestUrl = config?.url ?? '';
    const { access_token, refresh_token } = useAuthStore.getState();

    if (error.response?.status !== 401 || !config?._sessionAuth || !access_token) {
      return Promise.reject(error);
    }
    if (!shouldForceLogoutOn401(requestUrl)) return Promise.reject(error);

    if (config._authRetried || !refresh_token) {
      await handleUnauthorizedResponse(
        requestUrl,
        signOutReasonFromRequestFailure(errorDetail(error.response?.data))
      );
      return Promise.reject(error);
    }

    config._authRetried = true;
    let token: string;
    try {
      // Rotated by another request since this one left: just resend with the new token.
      const sent = bearerOf(config);
      token = sent && sent !== access_token ? access_token : await refreshSession();
    } catch {
      // Refused refresh: refreshSession has already signed the user out.
      return Promise.reject(error);
    }
    config.headers.set('Authorization', `Bearer ${token}`);
    return client.request(config);
  };
}

function installSessionInterceptors(client: AxiosInstance, addWhenMissing: boolean) {
  client.interceptors.request.use(sessionTokenRequestInterceptor(addWhenMissing));
  client.interceptors.response.use((response) => response, sessionUnauthorizedInterceptor(client));
}

// Direct `axios.post(...)` calls (2FA verify, biometric login, ToS) go through the global
// instance, so tag those too and keep their session token fresh. Installed once at load.
axios.interceptors.request.use(attachDeviceId);
installSessionInterceptors(axios, false);

const warnedMissingUrls = new Set<Service>();

const Api = (service: Service = 'user') => {
  // A missing URL makes every request to this service fail (e.g. plan checks then treat every
  // estate as free), so make the misconfiguration obvious in development.
  if (__DEV__ && !SERVICE_URLS[service] && !warnedMissingUrls.has(service)) {
    warnedMissingUrls.add(service);
    console.warn(
      `No API URL for the ${service} service: set EXPO_PUBLIC_${service.toUpperCase()}_SERVICE_API_URL and restart Metro.`
    );
  }

  const access_token = useAuthStore.getState().access_token;

  const url = SERVICE_URLS[service];
  if (!url) {
    throw new Error(`API URL for service '${service}' is missing from env variables`);
  }

  const client = axios.create({
    baseURL: `${url}/api/v1`,
    timeout: 10000,
    headers: {
      // Replaced at send time by the session interceptor; kept so callers see the shape.
      Authorization: access_token ? `Bearer ${access_token}` : undefined,
    },
  });

  // Instances made by axios.create do not inherit global interceptors.
  client.interceptors.request.use(attachDeviceId);
  installSessionInterceptors(client, true);

  return client;
};

export default Api;
