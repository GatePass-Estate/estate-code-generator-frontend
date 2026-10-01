import Api from '.';
import { CodesApiResponse } from '@/src/types/codes';
import { Estate, PublicEstateListResponse } from '@/src/types/estate';
import { getErrorMessage } from '../helpers';

export async function getEstates(id: string): Promise<CodesApiResponse> {
  try {
    const api = Api('code');
    const axiosRes = await api.get(`/codeservice/all/${id}?receiver=visitor`);
    const data = axiosRes.data;

    return data;
  } catch (error: any) {
    throw new Error(`${getErrorMessage(error) || 'Could not fetch code'} `);
  }
}

export async function searchPublicEstates(query: string): Promise<PublicEstateListResponse> {
  try {
    const api = Api();
    const axiosRes = await api.get(`/estates/public/search`, {
      params: { search_query: query },
    });

    return axiosRes.data;
  } catch (error: any) {
    throw new Error(`${getErrorMessage(error) || 'Failed to search estates'} `);
  }
}

export async function getEstateById(estateId: string): Promise<Estate> {
  try {
    const api = Api();
    const axiosRes = await api.get<Estate>(`/estates/${encodeURIComponent(estateId)}`);
    return axiosRes.data;
  } catch (error: unknown) {
    throw new Error(`${getErrorMessage(error) || 'Failed to load estate details'} `);
  }
}
