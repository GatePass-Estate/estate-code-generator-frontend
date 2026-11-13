import { raiseApiError } from '@/src/shared/services/api/errors';
import Api from '@/src/shared/services/api/client';
import { CodesApiResponse } from '@/src/features/access-codes/types/codes';
import { Estate, PublicEstateListResponse } from '@/src/features/admin/types/estate';

export async function getEstates(id: string): Promise<CodesApiResponse> {
  try {
    const api = Api('code');
    const axiosRes = await api.get(`/codeservice/all/${id}?receiver=visitor`);
    const data = axiosRes.data;

    return data;
  } catch (error: unknown) {
    raiseApiError(error, 'Could not fetch code', true);
  }
}

export async function searchPublicEstates(query: string): Promise<PublicEstateListResponse> {
  try {
    const api = Api();
    const axiosRes = await api.get(`/estates/public/search`, {
      params: { search_query: query },
    });

    return axiosRes.data;
  } catch (error: unknown) {
    raiseApiError(error, 'Failed to search estates', true);
  }
}

export async function getEstateById(estateId: string): Promise<Estate> {
  try {
    const api = Api();
    const axiosRes = await api.get<Estate>(`/estates/${encodeURIComponent(estateId)}`);
    return axiosRes.data;
  } catch (error: unknown) {
    raiseApiError(error, 'Failed to load estate details', true);
  }
}

export async function transferPrimaryAdmin(estateId: string, adminId: string): Promise<void> {
  try {
    const api = Api();
    await api.post(`/estates/${encodeURIComponent(estateId)}/assign/admin`, null, {
      params: { admin_id: adminId },
    });
  } catch (error: unknown) {
    raiseApiError(error, 'Failed to transfer primary admin');
  }
}
