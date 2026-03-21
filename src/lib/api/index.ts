import { Platform } from 'react-native';
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const Api = (service: 'user' | 'code' = 'user') => {
	const access_token = useAuthStore.getState().access_token;

	let url = service === 'user' ? process.env.EXPO_PUBLIC_USER_SERVICE_API_URL : process.env.EXPO_PUBLIC_CODE_SERVICE_API_URL;

	if (Platform.OS === 'web' && url?.includes('10.0.2.2')) {
		url = url.replace('10.0.2.2', 'localhost');
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
