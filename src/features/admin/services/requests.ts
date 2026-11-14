import { isAxiosError } from 'axios';
import { raiseApiError } from '@/src/shared/services/api/errors';
import Api from '@/src/shared/services/api/client';
import {
  CreateEditRequestResponse,
  EditRequestResponse,
  GetRequestsResponse,
  PendingRequestsResponse,
  RemindAdminsResponse,
  RequestItem,
  RequestType,
  SearchRequestPayload,
  UpdatePendingRequestResponse,
} from '@/src/features/admin/types/requests';
import { getErrorMessage } from '@/src/shared/utils/helpers';

export const approveRequests = async (id: string): Promise<EditRequestResponse> => {
  try {
    const api = Api();
    const axiosRes = await api.patch(`/requests/edit/${id}/status`, { status: 'approved' });
    const data = axiosRes.data;

    return data;
  } catch (error: unknown) {
    raiseApiError(error, 'An error occured', true);
  }
};

export const declineRequests = async (id: string): Promise<EditRequestResponse> => {
  try {
    const api = Api();
    const axiosRes = await api.patch(`/requests/edit/${id}/status`, { status: 'rejected' });
    const data = axiosRes.data;

    return data;
  } catch (error: unknown) {
    raiseApiError(error, 'An error occured', true);
  }
};

export const updatePendingRequest = async (
  id: string,
  new_value: string
): Promise<UpdatePendingRequestResponse> => {
  try {
    const api = Api();
    const axiosRes = await api.patch(`/requests/edit/${id}`, { new_value });
    const data = axiosRes.data;

    return data;
  } catch (error: unknown) {
    raiseApiError(error, 'An error occured', true);
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
  } catch (error: unknown) {
    raiseApiError(error, 'Could not fetch requests', true);
  }
}

/** The signed-in user's own edit requests, any status, newest first. */
export async function getMyRequests(page = 1, limit = 20): Promise<GetRequestsResponse> {
  try {
    const api = Api();
    const axiosRes = await api.get(`/requests/edit/me`, { params: { page, limit } });
    return axiosRes.data;
  } catch (error: unknown) {
    raiseApiError(error, 'Could not fetch your requests', true);
  }
}

export async function createRequest(
  request_type: RequestType,
  old_value: string,
  new_value: string
): Promise<CreateEditRequestResponse> {
  try {
    const api = Api();
    const axiosRes = await api.post(`/requests/edit`, { request_type, old_value, new_value });
    const data = axiosRes.data;

    return data;
  } catch (error: unknown) {
    raiseApiError(error, 'Could not create request', true);
  }
}

export async function getRequestById(id: string): Promise<RequestItem> {
  try {
    const api = Api();
    const axiosRes = await api.get(`/requests/edit/${id}`);
    const data = axiosRes.data;
    return data;
  } catch (error: unknown) {
    raiseApiError(error, 'Could not fetch request', true);
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
  } catch (error: unknown) {
    raiseApiError(error, 'Could not check pending requests', true);
  }
}

export async function deletePendingRequest(id: string): Promise<boolean> {
  try {
    const api = Api();
    const axiosRes = await api.delete(`/requests/edit/${id}`);
    return axiosRes.data;
  } catch (error: unknown) {
    raiseApiError(error, 'Could not delete request', true);
  }
}

export class RemindAdminsError extends Error {
  nextRemindAfter?: string;
  status?: number;

  constructor(message: string, nextRemindAfter?: string, status?: number) {
    super(message);
    this.name = 'RemindAdminsError';
    this.nextRemindAfter = nextRemindAfter;
    this.status = status;
  }
}

export async function remindAdmins(id: string): Promise<RemindAdminsResponse> {
  try {
    const api = Api();
    const axiosRes = await api.post(`/requests/edit/${id}/remind`);
    return axiosRes.data;
  } catch (error: unknown) {
    const detail = isAxiosError(error)
      ? (error.response?.data as { detail?: { next_remind_after?: string } } | undefined)?.detail
      : undefined;
    const nextRemindAfter = detail?.next_remind_after;
    const message = getErrorMessage(error) || 'Could not remind admin';
    throw new RemindAdminsError(
      message,
      nextRemindAfter,
      isAxiosError(error) ? error.response?.status : undefined
    );
  }
}
