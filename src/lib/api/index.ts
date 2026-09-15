import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const Api = (service: 'user' | 'code' | 'ai' = 'user') => {
  const access_token = useAuthStore.getState().access_token;

  let url;
  if (service === 'ai') {
    url = process.env.EXPO_PUBLIC_AI_SERVICE_API_URL;
  } else if (service === 'user') {
    url = process.env.EXPO_PUBLIC_USER_SERVICE_API_URL;
  } else {
    url = process.env.EXPO_PUBLIC_CODE_SERVICE_API_URL;
  }

  return axios.create({
    baseURL: `${url}/api/v1`,
    timeout: 10000,
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });
};

export default Api;
