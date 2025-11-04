import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState } from './stores/authStore';
import axios from 'axios';

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
