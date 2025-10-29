import Api from '.';
import { CodesApiResponse } from '@/src/types/codes';
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
