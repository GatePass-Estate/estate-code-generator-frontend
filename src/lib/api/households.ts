import Api from '.';
import { getErrorMessage } from '../helpers';
import type {
  CreateHouseholdPayload,
  CreateHouseholdResponse,
  Household,
  SearchHouseholdsResponse,
  TransferHouseholdPayload,
  TransferHouseholdResponse,
} from '@/src/types/household';

export async function searchHouseholds(
  name?: string,
  page: number = 1,
  limit: number = 50
): Promise<SearchHouseholdsResponse> {
  try {
    const api = Api();
    const response = await api.get<SearchHouseholdsResponse>('/households/search', {
      params: { name: name?.trim() || undefined, page, limit },
    });
    return response.data;
  } catch (error: unknown) {
    throw new Error(`${getErrorMessage(error) || 'Could not load households'} `);
  }
}

export async function transferUserHousehold(
  payload: TransferHouseholdPayload
): Promise<TransferHouseholdResponse> {
  try {
    const api = Api();
    const response = await api.post<TransferHouseholdResponse>('/households/transfer', payload);
    return response.data;
  } catch (error: unknown) {
    throw new Error(`${getErrorMessage(error) || 'Could not transfer user'} `);
  }
}

export async function createHousehold(
  payload: CreateHouseholdPayload
): Promise<CreateHouseholdResponse> {
  try {
    const api = Api();
    const response = await api.post<CreateHouseholdResponse>('/households', payload);
    return response.data;
  } catch (error: unknown) {
    throw new Error(`${getErrorMessage(error) || 'Could not create household'} `);
  }
}

export function householdFromCreation(
  response: CreateHouseholdResponse,
  payload: CreateHouseholdPayload
): Household {
  return {
    id: response.id,
    name: payload.name.trim(),
    estate_id: payload.estate_id,
    head_user_id: payload.head_user_id ?? null,
    created_at: response.created_at,
  };
}
