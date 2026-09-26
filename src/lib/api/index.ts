import axios, { type AxiosError } from 'axios';
import { useAuthStore } from '../stores/authStore';
import { handleUnauthorizedResponse } from '../session';

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

const Api = (service: Service = 'user') => {
  const access_token = useAuthStore.getState().access_token;

  const client = axios.create({
    baseURL: `${SERVICE_URLS[service]}/api/v1`,
    timeout: 10000,
    headers: {
      Authorization: access_token ? `Bearer ${access_token}` : undefined,
    },
  });

  return attachUnauthorizedInterceptor(client);
};

export default Api;
