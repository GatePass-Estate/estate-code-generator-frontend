import Api from '.';
import { Codes, CodesApiResponse, GenerateCodePayload } from '@/src/types/codes';
import { getErrorMessage } from '../helpers';
import { GenderType, RelationshipType } from '@/src/types/general';

export async function getAllCodes(id: string): Promise<CodesApiResponse> {
	try {
		const api = Api('code');
		const axiosRes = await api.get(`/codeservice/all/${id}?receiver=visitor`);
		const data = axiosRes.data;

		return data;
	} catch (error: any) {
		throw new Error(`${getErrorMessage(error) || 'Could not fetch code'} `);
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
		const axiosRes = await api.get(`/codeservice/${code}/?receiver=visitor`);
		const data = axiosRes.data;

		return data;
	} catch (error: any) {
		throw new Error(`${getErrorMessage(error) || 'Could not fetch code'} `);
	}
}

export const deleteCode = async (code: string): Promise<Boolean> => {
	try {
		const api = Api('code');

		const axiosRes = await api.delete(`/codeservice/${code}`);

		const ok = axiosRes.status >= 200 && axiosRes.status < 300;
		const data = axiosRes.data;

		if (!ok) throw new Error(data?.detail || data?.message || 'An error occured');

		return data;
	} catch (error: any) {
		throw new Error(`${getErrorMessage(error) || 'An error occured'} `);
	}
};

export const generateCode = async (payload: { user_id: string; estate_id: string; visitor_fullname?: string; relationship_with_resident?: RelationshipType; gender?: GenderType }, type: 'visitor' | 'resident' = 'visitor'): Promise<GenerateCodePayload> => {
	try {
		const api = Api('code');

		const axiosRes = await api.post(`/codeservice?receiver=${type}`, {
			user_id: payload.user_id,
			estate_id: payload.estate_id,
			visitor_fullname: payload.visitor_fullname,
			relationship_with_resident: payload.relationship_with_resident,
			gender: payload.gender,
		});

		const ok = axiosRes.status >= 200 && axiosRes.status < 300;
		const data = axiosRes.data;

		if (!ok) throw new Error(data?.detail || data?.message || 'An error occured');

		return data;
	} catch (error: any) {
		throw new Error(`${getErrorMessage(error) || 'An error occured'} `);
	}
};
