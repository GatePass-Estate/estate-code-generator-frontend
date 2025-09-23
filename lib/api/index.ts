import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const Api = () => {
	const access_token = useAuthStore.getState().access_token;

	return axios.create({
		baseURL: `${process.env.EXPO_PUBLIC_API_URL}/api/v1`,
		timeout: 10000,
		headers: {
			Authorization: `Bearer ${access_token}`,
		},
	});
};

export default Api;
