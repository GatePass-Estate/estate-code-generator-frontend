import axios, { isAxiosError } from 'axios';
import { useAuthStore } from '../stores/authStore';
import { isSessionInvalidDetail, notifySessionExpired } from '../sessionExpiry';
import { attachDeviceId } from '../deviceId';

// Direct `axios.post(...)` calls (2FA verify, biometric login, ToS) go through
// the global instance, so tag those too. Installed once at module load.
axios.interceptors.request.use(attachDeviceId);

type Service = 'user' | 'code' | 'revenue';

const SERVICE_URLS: Record<Service, string | undefined> = {
  user: process.env.EXPO_PUBLIC_USER_SERVICE_API_URL,
  code: process.env.EXPO_PUBLIC_CODE_SERVICE_API_URL,
  revenue: process.env.EXPO_PUBLIC_REVENUE_SERVICE_API_URL,
};

const Api = (service: Service = 'user') => {
  const access_token = useAuthStore.getState().access_token;

  const instance = axios.create({
    baseURL: `${SERVICE_URLS[service]}/api/v1`,
    timeout: 10000,
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });

  // Instances made by axios.create do not inherit global interceptors.
  instance.interceptors.request.use(attachDeviceId);

  // A session revoked from another device keeps returning 401 for every call.
  // Surface that once so the auth provider can sign this device out instead of
  // leaving the user in a broken, half-authenticated app.
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (
        isAxiosError(error) &&
        error.response?.status === 401 &&
        isSessionInvalidDetail(error.response?.data?.detail) &&
        // Only meaningful once we believed we were signed in.
        useAuthStore.getState().access_token
      ) {
        notifySessionExpired(String(error.response?.data?.detail));
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

export default Api;
