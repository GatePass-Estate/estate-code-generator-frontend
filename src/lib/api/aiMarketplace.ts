import Api from '.';
import { getErrorMessage } from '../helpers';
import {
  MarketplaceListParams,
  MarketplaceListResponse,
  MarketplaceDetailResponse,
  RatingRequest,
  RatingResponse,
  SubscribeRequest,
  SubscribeResponse,
} from '@/src/types/aiMarketplace';

function buildMarketplaceQuery(params?: MarketplaceListParams): string {
  if (!params) return '';
  const search = new URLSearchParams();

  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));

  if (params.purchase_status) {
    const statuses = Array.isArray(params.purchase_status)
      ? params.purchase_status
      : [params.purchase_status];
    statuses.forEach((s) => search.append('purchase_status', s));
  }

  if (params.category) {
    const categories = Array.isArray(params.category) ? params.category : [params.category];
    categories.forEach((c) => search.append('category', c));
  }

  const query = search.toString();
  return query ? `?${query}` : '';
}

/**
 * List marketplace products for the caller's estate.
 */
export async function getMarketplaceFeatures(
  params?: MarketplaceListParams
): Promise<MarketplaceListResponse> {
  try {
    const api = Api('ai');
    const response = await api.get(`/ai-marketplace${buildMarketplaceQuery(params)}`);
    return response.data;
  } catch (error: any) {
    throw new Error(getErrorMessage(error) || 'Failed to fetch AI marketplace features');
  }
}

/**
 * Return one marketplace product with child tiers and estate grant status.
 */
export async function getMarketplaceFeatureById(id: string): Promise<MarketplaceDetailResponse> {
  try {
    const api = Api('ai');
    const response = await api.get(`/ai-marketplace/${encodeURIComponent(id)}`);
    console.log('\n--- GET MARKETPLACE FEATURE BY ID ---');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('-------------------------------------\n');
    return response.data;
  } catch (error: any) {
    throw new Error(getErrorMessage(error) || 'Failed to fetch feature details');
  }
}

/**
 * Subscribe the estate to a child ai_feature tier of this product.
 */
export async function subscribeMarketplaceFeature(
  id: string,
  payload: SubscribeRequest
): Promise<SubscribeResponse> {
  try {
    const api = Api('ai');
    const response = await api.post(`/ai-marketplace/${encodeURIComponent(id)}/subscribe`, payload);
    return response.data;
  } catch (error: any) {
    throw new Error(getErrorMessage(error) || 'Failed to subscribe to feature');
  }
}

/**
 * Rate a feature (create or update rating).
 */
export async function rateMarketplaceFeature(
  id: string,
  payload: RatingRequest
): Promise<RatingResponse> {
  try {
    const api = Api('ai');
    const response = await api.post(`/ai-marketplace/${encodeURIComponent(id)}/rating`, payload);
    return response.data;
  } catch (error: any) {
    throw new Error(getErrorMessage(error) || 'Failed to submit rating');
  }
}

/**
 * Helper to build display picture URL from GCS object path.
 */
export function getFeaturePictureUrl(path: string): string {
  const baseUrl =
    process.env.EXPO_PUBLIC_AI_SERVICE_API_URL || 'https://staging-api.gatepassng.com/ai';
  return `${baseUrl}/api/v1/ai-marketplace/picture?path=${encodeURIComponent(path)}`;
}
