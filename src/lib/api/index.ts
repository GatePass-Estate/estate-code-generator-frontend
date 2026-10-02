import axios, { type AxiosError } from 'axios';
import { useAuthStore } from '../stores/authStore';
import { handleUnauthorizedResponse } from '../session';
import { attachDeviceId } from '../deviceId';

// Direct `axios.post(...)` calls (2FA verify, biometric login, ToS) go through
// the global instance, so tag those too. Installed once at module load.
axios.interceptors.request.use(attachDeviceId);

type Service = 'user' | 'code' | 'ai' | 'revenue';

const SERVICE_URLS: Record<Service, string | undefined> = {
  user: process.env.EXPO_PUBLIC_USER_SERVICE_API_URL,
  code: process.env.EXPO_PUBLIC_CODE_SERVICE_API_URL,
  ai: process.env.EXPO_PUBLIC_AI_SERVICE_API_URL,
  revenue: process.env.EXPO_PUBLIC_REVENUE_SERVICE_API_URL,
};

function attachUnauthorizedInterceptor(
  client: ReturnType<typeof axios.create>
): ReturnType<typeof axios.create> {
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const status = error.response?.status;
      const hadToken = !!useAuthStore.getState().access_token;
      const requestUrl = error.config?.url ?? '';

      if (status === 401 && hadToken) {
        await handleUnauthorizedResponse(requestUrl);
      }

      return Promise.reject(error);
    }
  );
  return client;
}

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
      Authorization: access_token ? `Bearer ${access_token}` : undefined,
    },
  });

  // Instances made by axios.create do not inherit global interceptors.
  client.interceptors.request.use(attachDeviceId);

  return attachUnauthorizedInterceptor(client);
};

export default Api;
