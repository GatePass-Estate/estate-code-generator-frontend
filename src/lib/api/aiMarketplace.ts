import Api from '.';
import { getErrorMessage } from '../helpers';
import {
  MarketplaceListParams,
  MarketplaceListResponse,
  MarketplaceDetailResponse,
  MarketplaceTier,
  RatingRequest,
  RatingResponse,
  SubscribeRequest,
  SubscribeResponse,
} from '@/src/types/aiMarketplace';

export function isLocalMarketplaceId(id?: string | null): boolean {
  return !id || id.startsWith('local-');
}

/** Prefer a real product UUID; fall back to matching a live list item by name. */
export async function resolveMarketplaceFeatureId(
  featureId: string | undefined,
  nameMatch: (name: string) => boolean
): Promise<string | undefined> {
  if (featureId && !isLocalMarketplaceId(featureId)) return featureId;
  const list = await getMarketplaceFeatures();
  return list.items?.find((item) => nameMatch(item.name))?.id;
}

/** Turn API description into Product Feature bullets (newlines / bullets / sentences). */
export function splitFeatureBullets(description?: string | null): string[] {
  if (!description?.trim()) return [];
  const parts = description
    .split(/\n+|•|\u2022|(?<=[.!?])\s+(?=[A-Z])/)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : [description.trim()];
}

export function formatTierLabel(tier: string): string {
  const num = tier.replace(/\D/g, '');
  if (num) return `Tier ${num}`;
  return tier
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export function formatTierSubtitle(tier: MarketplaceTier): string {
  if (tier.is_installed || tier.status === 'installed') return 'PURCHASED';
  if (tier.is_free) return 'FREE';
  if (tier.price != null) {
    const prefix =
      tier.currency_code === 'NGN' ? '₦' : tier.currency_code ? `${tier.currency_code} ` : '';
    return `${prefix}${tier.price}`;
  }
  return '';
}

export function sortMarketplaceTiers(tiers: MarketplaceTier[]): MarketplaceTier[] {
  return [...tiers].sort((a, b) => {
    const na = Number.parseInt(a.tier.replace(/\D/g, ''), 10) || 0;
    const nb = Number.parseInt(b.tier.replace(/\D/g, ''), 10) || 0;
    return na - nb;
  });
}

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

/** Metro collapses nested objects as [Object] — pretty-print so logs are readable. */
function logJson(label: string, payload: unknown) {
  console.log(`\n================== ${label} ==================`);
  try {
    console.log(JSON.stringify(payload, null, 2));
  } catch {
    console.log(payload);
  }
  console.log('===================================================================\n');
}

/**
 * List marketplace products for the caller's estate.
 * Powers AI Store list + resolving the product behind "Choose Subscription Plan".
 */
export async function getMarketplaceFeatures(
  params?: MarketplaceListParams
): Promise<MarketplaceListResponse> {
  const path = `/ai-marketplace${buildMarketplaceQuery(params)}`;
  logJson('[ai-marketplace] list request (Choose Subscription Plan)', { path, params });
  try {
    const api = Api('ai');
    const response = await api.get(path);
    logJson('[ai-marketplace] list response (Choose Subscription Plan)', {
      path,
      params,
      data: response.data,
    });
    return response.data;
  } catch (error: any) {
    logJson('[ai-marketplace] list error (Choose Subscription Plan)', {
      path,
      params,
      message: getErrorMessage(error) || String(error),
    });
    throw new Error(getErrorMessage(error) || 'Failed to fetch AI marketplace features');
  }
}

/**
 * Return one marketplace product with child tiers and estate grant status.
 * Drives the "Choose Subscription Plan" tier cards on Preview.
 */
export async function getMarketplaceFeatureById(id: string): Promise<MarketplaceDetailResponse> {
  const path = `/ai-marketplace/${encodeURIComponent(id)}`;
  logJson('[ai-marketplace] detail request (Choose Subscription Plan)', { path, id });
  try {
    const api = Api('ai');
    const response = await api.get(path);
    logJson('[ai-marketplace] detail response (Choose Subscription Plan)', {
      path,
      id,
      data: response.data,
    });
    return response.data;
  } catch (error: any) {
    logJson('[ai-marketplace] detail error (Choose Subscription Plan)', {
      path,
      id,
      message: getErrorMessage(error) || String(error),
    });
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
 * Uninstall an AI feature grant for the estate (free or paid tier).
 * Revenue: POST /ai-features/estate/{estate_id}/uninstall
 */
export async function uninstallMarketplaceFeature(
  estateId: string,
  featureKey: string
): Promise<void> {
  try {
    const api = Api('revenue');
    await api.post(`/ai-features/estate/${encodeURIComponent(estateId)}/uninstall`, {
      feature_key: featureKey,
    });
  } catch (error: any) {
    throw new Error(getErrorMessage(error) || 'Failed to uninstall feature');
  }
}

/**
 * Cancel the estate's Paystack AI/subscription auto-renew.
 * Revenue: POST /subscriptions/estate/{estate_id}/cancel
 */
export async function cancelMarketplaceSubscription(estateId: string): Promise<void> {
  try {
    const api = Api('revenue');
    await api.post(`/subscriptions/estate/${encodeURIComponent(estateId)}/cancel`);
  } catch (error: any) {
    throw new Error(getErrorMessage(error) || 'Failed to cancel subscription');
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
