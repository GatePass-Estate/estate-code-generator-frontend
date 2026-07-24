import Api from '.';
import {
  EditRequestResponse,
  GetRequestsResponse,
  PendingRequestsResponse,
  RemindAdminsResponse,
  RequestItem,
  RequestType,
  SearchRequestPayload,
} from '@/src/types/requests';
import { getErrorMessage } from '../helpers';

export const approveRequests = async (id: string): Promise<EditRequestResponse> => {
  try {
    const api = Api();
    const axiosRes = await api.patch(`/requests/edit/${id}/status`, { status: 'approved' });
    const data = axiosRes.data;

    return data;
  } catch (error: any) {
    throw new Error(`${getErrorMessage(error) || 'An error occured'} `);
  }
};

export const declineRequests = async (id: string): Promise<EditRequestResponse> => {
  try {
    const api = Api();
    const axiosRes = await api.patch(`/requests/edit/${id}/status`, { status: 'rejected' });
    const data = axiosRes.data;

    return data;
  } catch (error: any) {
    throw new Error(`${getErrorMessage(error) || 'An error occured'} `);
  }
};

export const updatePendingRequest = async (
  id: string,
  new_value: string
): Promise<EditRequestResponse> => {
  try {
    const api = Api();
    const axiosRes = await api.patch(`/requests/edit/${id}`, { new_value });
    const data = axiosRes.data;

    return data;
  } catch (error: any) {
    throw new Error(`${getErrorMessage(error) || 'An error occured'} `);
  }
};

export async function getRequests(payload: SearchRequestPayload): Promise<GetRequestsResponse> {
  try {
    const api = Api();
    const params = new URLSearchParams();
    params.append('page', payload.page.toString());
    params.append('limit', payload.limit.toString());
    if (payload.request_type) params.append('request_type', payload.request_type);
    if (payload.status) params.append('status', payload.status);
    if (payload.resident_id) params.append('resident_id', payload.resident_id);
    if (payload.from_date) params.append('from_date', payload.from_date);
    if (payload.to_date) params.append('to_date', payload.to_date);

    const axiosRes = await api.get(`/requests/edit?${params.toString()}`);
    const data = axiosRes.data;

    return data;
  } catch (error: any) {
    throw new Error(`${getErrorMessage(error) || 'Could not fetch requests'} `);
  }
}

export async function createRequest(
  request_type: RequestType,
  old_value: string,
  new_value: string
): Promise<boolean> {
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

export async function checkPendingRequests(
  requestType: RequestType
): Promise<PendingRequestsResponse> {
  try {
    const api = Api();
    const axiosRes = await api.get(`/requests/edit/pending/check?request_type=${requestType}`);
    const data = axiosRes.data;
    return data;
  } catch (error: any) {
    throw new Error(`${getErrorMessage(error) || 'Could not check pending requests'} `);
  }
}

export async function deletePendingRequest(id: string): Promise<boolean> {
  try {
    const api = Api();
    const axiosRes = await api.delete(`/requests/edit/${id}`);
    return axiosRes.data;
  } catch (error: any) {
    throw new Error(`${getErrorMessage(error) || 'Could not delete request'} `);
  }
}

export async function remindAdmins(id: string): Promise<RemindAdminsResponse> {
  try {
    const api = Api();
    const axiosRes = await api.post(`/requests/edit/${id}/remind`);
    return axiosRes.data;
  } catch (error: any) {
    const detail = error?.response?.data?.detail;
    const nextRemindAfter =
      detail && typeof detail === 'object' ? detail.next_remind_after : undefined;
    const message = getErrorMessage(error) || 'Could not remind admin';
    const err = new Error(message) as Error & { nextRemindAfter?: string; status?: number };
    err.nextRemindAfter = nextRemindAfter;
    err.status = error?.response?.status;
    throw err;
  }
}
