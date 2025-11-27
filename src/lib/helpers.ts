import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState } from './stores/authStore';
import axios from 'axios';
import { Codes } from '../types/codes';

const authStorageKey = process.env.EXPO_PUBLIC_AUTH_STORAGE_KEY!;

export const storeAuthState = async (userData: AuthState): Promise<boolean> => {
	try {
		const jsonValue = JSON.stringify(userData);
		await AsyncStorage.setItem(authStorageKey, jsonValue);
		return true;
	} catch (error) {
		console.log('Error saving auth state', error);
		return false;
	}
};

export const clearAuthState = async (): Promise<void> => {
	try {
		await AsyncStorage.removeItem(authStorageKey);
	} catch (error) {
		console.log('Error clearing auth state', error);
	}
};

export const getAuthState = async (): Promise<AuthState | null> => {
	try {
		const jsonValue = await AsyncStorage.getItem(authStorageKey);
		return jsonValue != null ? JSON.parse(jsonValue) : null;
	} catch (error) {
		console.log('Error retrieving auth state', error);
		return null;
	}
};

export const getErrorMessage = (error: any): string => {
	if (axios.isAxiosError(error) && error.response?.data) {
		const data = error.response.data;

		if (Array.isArray(data.detail)) {
			const first = data.detail[0];
			if (first?.msg) {
				return first.msg;
			}
		}

		if (typeof data.detail === 'string') {
			return data.detail;
		}
	}

	if (error.message) {
		if (error.message === 'Network Error') return 'Network error - please check your internet connection.';

		if (error.message === 'Request failed with status code 401') return 'Unauthorized - please check your credentials.';

		if (error.message === 'Request failed with status code 403') return 'Forbidden - you do not have permission to access this resource.';

		if (error.message === 'Request failed with status code 404') return 'Not Found - the requested resource could not be found.';

		if (error.message === 'Request failed with status code 500') return 'Server error - please try again later.';

		if (error.message.includes('timeout') || error.message.includes('timed out') || error.message.includes('exceeded')) return 'Request timed out - please check your network connection and try again.';
	}

	return error.message ?? 'An unknown error occurred';
};

export const ordinalSuffix = (day: number): string => {
	if (day > 3 && day < 21) return 'th';
	switch (day % 10) {
		case 1:
			return 'st';
		case 2:
			return 'nd';
		case 3:
			return 'rd';
		default:
			return 'th';
	}
};

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const formatDateWithOrdinal = (date: Date): string => {
	const d = date.getDate();
	const m = monthNames[date.getMonth()];
	const y = date.getFullYear();
	return `${d}${ordinalSuffix(d)} ${m} ${y}`;
};

export const timeCalc = (
	valid_until: string | Date | undefined
): {
	formattedDate: string;
	timeframe: string;
	timeLeftMinutes: number;
} => {
	const iso = String(valid_until ?? '')
		.replace(' ', 'T')
		.replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
	const parsed = new Date(iso);

	let formattedDate = 'Invalid date';
	let timeframe = 'Unknown';
	let timeLeftMinutes = 0;

	if (!isNaN(parsed.getTime())) {
		const day = String(parsed.getDate()).padStart(2, '0');
		const month = String(parsed.getMonth() + 1).padStart(2, '0');
		const year = parsed.getFullYear();
		formattedDate = `${day}/${month}/${year}`;

		const diffMs = parsed.getTime() - Date.now();
		if (diffMs <= 0) {
			timeframe = 'Expired';
		} else {
			const startDate = new Date(parsed.getTime() - 60 * 60 * 1000);
			const formatTime = (d: Date) => d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true }).replace(/\s+/g, '').toLowerCase();
			timeLeftMinutes = Math.floor((diffMs % 3600000) / 60000);
			timeframe = `${formatTime(startDate)} to ${formatTime(parsed)}`;
		}
	}

	return { formattedDate, timeframe, timeLeftMinutes };
};
