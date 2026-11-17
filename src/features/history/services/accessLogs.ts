import { isAxiosError } from 'axios';
import { raiseApiError } from '@/src/shared/services/api/errors';
import Api from '@/src/shared/services/api/client';
import {
  AccessLogHistoryParams,
  ResidentCodeHistoryResponse,
  ResidentLogListResponse,
  VisitorLogListResponse,
} from '@/src/features/history/types/accessLogs';

function buildQuery(params?: AccessLogHistoryParams) {
  const search = new URLSearchParams();

  if (params?.page) search.set('page', String(params.page));
  if (params?.limit) search.set('limit', String(params.limit));
  if (params?.from_date) search.set('from_date', params.from_date);
  if (params?.to_date) search.set('to_date', params.to_date);

  const query = search.toString();
  return query ? `?${query}` : '';
}

export async function getMyResidentAccessLogs(
  params?: AccessLogHistoryParams
): Promise<ResidentLogListResponse> {
  try {
    const api = Api('code');
    const axiosRes = await api.get(`/codeservice/residentlog/me${buildQuery(params)}`);
    return axiosRes.data;
  } catch (error: unknown) {
    raiseApiError(error, 'Could not fetch access history', true);
  }
}

export async function getMyVisitorAccessLogs(
  params?: AccessLogHistoryParams
): Promise<VisitorLogListResponse> {
  try {
    const api = Api('code');
    const axiosRes = await api.get(`/codeservice/visitorlog/me${buildQuery(params)}`);
    return axiosRes.data;
  } catch (error: unknown) {
    // No visitor history yet
    if (isAxiosError(error) && error.response?.status === 404) {
      return { total: 0, page: params?.page ?? 1, limit: params?.limit ?? 20, items: [] };
    }
    raiseApiError(error, 'Could not fetch guest history', true);
  }
}

export async function getMyResidentAccessLogByCode(
  code: string,
  params?: AccessLogHistoryParams
): Promise<ResidentCodeHistoryResponse> {
  try {
    const api = Api('code');
    const axiosRes = await api.get(
      `/codeservice/residentlog/me/${encodeURIComponent(code)}${buildQuery(params)}`
    );
    return axiosRes.data;
  } catch (error: unknown) {
    raiseApiError(error, 'Could not fetch code history', true);
  }
}

export async function getMyVisitorAccessLogByCode(
  code: string,
  params?: AccessLogHistoryParams
): Promise<VisitorLogListResponse> {
  try {
    const api = Api('code');
    const axiosRes = await api.get(
      `/codeservice/visitorlog/me/${encodeURIComponent(code)}${buildQuery(params)}`
    );
    return axiosRes.data;
  } catch (error: unknown) {
    raiseApiError(error, 'Could not fetch guest code history', true);
  }
}

export async function getEstateVisitorLogs(
  params?: AccessLogHistoryParams
): Promise<VisitorLogListResponse> {
  try {
    const api = Api('code');
    const axiosRes = await api.get(`/codeservice/visitorlog/user${buildQuery(params)}`);
    return axiosRes.data;
  } catch (error: unknown) {
    raiseApiError(error, 'Could not fetch guest history', true);
  }
}

export async function getEstateResidentLogs(
  params?: AccessLogHistoryParams
): Promise<ResidentLogListResponse> {
  try {
    const api = Api('code');
    const axiosRes = await api.get(`/codeservice/residentlog/user${buildQuery(params)}`);
    return axiosRes.data;
  } catch (error: unknown) {
    raiseApiError(error, 'Could not fetch resident history', true);
  }
}

export async function getEstateVisitorLogByCode(
  code: string,
  params?: AccessLogHistoryParams
): Promise<VisitorLogListResponse> {
  try {
    const api = Api('code');
    const axiosRes = await api.get(
      `/codeservice/visitorlog/user/${encodeURIComponent(code)}${buildQuery(params)}`
    );
    return axiosRes.data;
  } catch (error: unknown) {
    raiseApiError(error, 'Could not fetch guest code history', true);
  }
}

export async function getEstateResidentLogByCode(
  code: string,
  params?: AccessLogHistoryParams
): Promise<ResidentCodeHistoryResponse> {
  try {
    const api = Api('code');
    const axiosRes = await api.get(
      `/codeservice/residentlog/user/${encodeURIComponent(code)}${buildQuery(params)}`
    );
    return axiosRes.data;
  } catch (error: unknown) {
    raiseApiError(error, 'Could not fetch resident code history', true);
  }
}
