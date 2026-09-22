import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

type ApiService = 'user' | 'code' | 'ai';

const Api = (service: ApiService = 'user') => {
  const access_token = useAuthStore.getState().access_token;

  const url =
    service === 'ai'
      ? process.env.EXPO_PUBLIC_AI_SERVICE_API_URL || 'https://staging-api.gatepassng.com/ai'
      : service === 'code'
        ? process.env.EXPO_PUBLIC_CODE_SERVICE_API_URL
        : process.env.EXPO_PUBLIC_USER_SERVICE_API_URL;

  return axios.create({
    baseURL: `${url}/api/v1`,
    timeout: 10000,
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });
};

export default Api;
