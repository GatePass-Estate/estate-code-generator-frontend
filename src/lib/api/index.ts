import { Platform } from 'react-native';
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const Api = (service: 'user' | 'code' = 'user') => {
	const access_token = useAuthStore.getState().access_token;

	let url = service === 'user' ? process.env.EXPO_PUBLIC_USER_SERVICE_API_URL : process.env.EXPO_PUBLIC_CODE_SERVICE_API_URL;

	// On web, always use localhost; on mobile use env URL (e.g. 172.20.10.3 for device→host)
	if (Platform.OS === 'web' && url && !url.includes('localhost')) {
		try {
			const u = new URL(url);
			url = `${u.protocol}//localhost:${u.port || (u.protocol === 'https:' ? 443 : 80)}`;
		} catch {
			// fallback for IP-like URLs
			url = url.replace(/^(https?:\/\/)[\d.]+/, '$1localhost');
		}
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
