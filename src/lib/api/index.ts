import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

type Service = 'user' | 'code' | 'revenue';

const SERVICE_URLS: Record<Service, string | undefined> = {
  user: process.env.EXPO_PUBLIC_USER_SERVICE_API_URL,
  code: process.env.EXPO_PUBLIC_CODE_SERVICE_API_URL,
  revenue: process.env.EXPO_PUBLIC_REVENUE_SERVICE_API_URL,
};

const Api = (service: Service = 'user') => {
  const access_token = useAuthStore.getState().access_token;

  return axios.create({
    baseURL: `${SERVICE_URLS[service]}/api/v1`,
    timeout: 10000,
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });
};

export default Api;
