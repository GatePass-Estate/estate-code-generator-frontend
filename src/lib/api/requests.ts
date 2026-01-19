import Api from '.';
import { GetRequestsResponse, PendingRequestsResponse, RequestItem, RequestStatus, RequestType } from '@/src/types/requests';
import { getErrorMessage } from '../helpers';

export const approveRequests = async (ids: string[]): Promise<boolean> => {
	try {
		const api = Api();
		const axiosRes = await api.get(`/users/guest`);
		const data = axiosRes.data;

		return data;
	} catch (error: any) {
		throw new Error(`${getErrorMessage(error) || 'An error occured'} `);
	}
};

export const declineRequests = async (ids: string[]): Promise<boolean> => {
	try {
		const api = Api();
		const axiosRes = await api.get(`/users/guest`);
		const data = axiosRes.data;

		return data;
	} catch (error: any) {
		throw new Error(`${getErrorMessage(error) || 'An error occured'} `);
	}
};

export async function getRequests(page: number, limit: number, status?: RequestStatus): Promise<GetRequestsResponse> {
	try {
		const api = Api();
		const axiosRes = await api.get(`/requests/edit?page=${page}&limit=${limit}&status=${status}`);
		const data = axiosRes.data;

		return data;
	} catch (error: any) {
		throw new Error(`${getErrorMessage(error) || 'Could not fetch requests'} `);
	}
}

export async function createRequest(request_type: RequestType, old_value: string, new_value: string): Promise<boolean> {
	try {
		const api = Api();
		const axiosRes = await api.post(`/requests/edit`, { request_type, old_value, new_value });
		const data = axiosRes.data;

		return data;
	} catch (error: any) {
		throw new Error(`${getErrorMessage(error) || 'Could not create request'} `);
	}
}

export async function getRequestById(id: string): Promise<RequestItem> {
	try {
		const api = Api();
		const axiosRes = await api.get(`/requests/edit/${id}`);
		const data = axiosRes.data;
		return data;
	} catch (error: any) {
		throw new Error(`${getErrorMessage(error) || 'Could not fetch request'} `);
	}
}

export async function checkPendingRequests(requestType: RequestType): Promise<PendingRequestsResponse> {
	try {
		const api = Api();
		const axiosRes = await api.get(`/requests/edit/pending/check?request_type=${requestType}`);
		const data = axiosRes.data;
		return data;
	} catch (error: any) {
		throw new Error(`${getErrorMessage(error) || 'Could not check pending requests'} `);
	}
}
