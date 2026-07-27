import Api from '.';
import { Codes, CodesApiResponse, GenerateCodePayload } from '@/src/types/codes';
import { getErrorMessage } from '../helpers';
import { GenderType, RelationshipType } from '@/src/types/general';

export async function getAllCodes(id: string): Promise<CodesApiResponse> {
  try {
    const api = Api('code');
    const axiosRes = await api.get(`/codeservice/all/${id}?receiver=visitor`);
    return axiosRes.data;
  } catch (error: any) {
    throw new Error(`${getErrorMessage(error) || 'Could not fetch code'} `);
  }
}

export async function getUpcomingCodes(id: string): Promise<CodesApiResponse> {
  try {
    const api = Api('code');
    const axiosRes = await api.get(`/codeservice/all/${id}?receiver=visitor&upcoming=true`);
    return axiosRes.data;
  } catch (error: any) {
    throw new Error(`${getErrorMessage(error) || 'Could not fetch upcoming codes'} `);
  }
}

export async function getMyCode(id: string): Promise<Codes> {
  try {
    const api = Api('code');
    const axiosRes = await api.get(`/codeservice/all/${id}?receiver=resident`);
    const data = axiosRes.data;

    return data;
  } catch (error: any) {
    throw new Error(`${getErrorMessage(error) || 'Could not fetch code'} `);
  }
}

export async function validateCode(code: string): Promise<Codes> {
  try {
    const api = Api('code');
    const axiosRes = await api.get(`/codeservice/${code}`);
    const data = axiosRes.data;

    return data;
  } catch (error: any) {
    throw new Error(`${getErrorMessage(error) || 'Could not fetch code'} `);
  }
}

export const deleteCode = async (code: string): Promise<boolean> => {
  try {
    const api = Api('code');
    const hashed = encodeURIComponent(String(code).replace(/\s+/g, '').trim());

    const axiosRes = await api.delete(`/codeservice/${hashed}`);
    const data = axiosRes.data;

    return data;
  } catch (error: any) {
    throw new Error(`${getErrorMessage(error) || 'An error occured'} `);
  }
};

export const generateCode = async (
  payload: {
    user_id: string;
    estate_id: string;
    visitor_fullname?: string;
    relationship_with_resident?: RelationshipType;
    gender?: GenderType;
    validity_period?: { start: string; end: string } | null;
    validity_window?: { start: string; end: string } | null;
  },
  type: 'visitor' | 'resident' = 'visitor'
): Promise<GenerateCodePayload> => {
  try {
    const api = Api('code');

    const body: Record<string, unknown> = {
      user_id: payload.user_id,
      estate_id: payload.estate_id,
      visitor_fullname: payload.visitor_fullname,
      relationship_with_resident: payload.relationship_with_resident,
      gender: payload.gender,
    };

    if (type === 'visitor') {
      if (payload.validity_period) body.validity_period = payload.validity_period;
      if (payload.validity_window) body.validity_window = payload.validity_window;
    }

    const axiosRes = await api.post(`/codeservice?receiver=${type}`, body);
    const data = axiosRes.data;

    return data;
  } catch (error: any) {
    throw new Error(`${getErrorMessage(error) || 'An error occured'} `);
  }
};
