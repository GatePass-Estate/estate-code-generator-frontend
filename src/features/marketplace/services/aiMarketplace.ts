import { isAxiosError } from 'axios';
import { raiseApiError } from '@/src/shared/services/api/errors';
import Api from '@/src/shared/services/api/client';
import {
  canManageBilling,
  featureActionErrorForRole,
  PRIMARY_ADMIN_FEATURE_ACTION_MESSAGE,
} from '@/src/features/billing/utils/billing';
import { getErrorMessage } from '@/src/shared/utils/helpers';
import { toBillingError } from '@/src/features/billing/services/billing';
import { formatKoboAmount } from '@/src/features/billing/utils/currency';
import { useUserStore } from '@/src/store/userStore';
import { queryClient } from '@/src/shared/services/api/queryClient';
import { queryKeys } from '@/src/shared/services/api/queryKeys';
import {
  MarketplaceListParams,
  MarketplaceListResponse,
  MarketplaceDetailResponse,
  MarketplaceTier,
  RatingRequest,
  RatingResponse,
  SubscribeRequest,
  SubscribeResponse,
  AiQuoteRequest,
  AiQuoteResponse,
} from '@/src/features/marketplace/types/aiMarketplace';

function requirePrimaryAdminForFeatureAction() {
  if (!canManageBilling(useUserStore.getState().role)) {
    throw new Error(PRIMARY_ADMIN_FEATURE_ACTION_MESSAGE);
  }
}

function throwFeatureActionError(error: unknown, fallback: string): never {
  throw new Error(
    featureActionErrorForRole(
      useUserStore.getState().role,
      { message: getErrorMessage(error) },
      fallback
    )
  );
}

export function isLocalMarketplaceId(id?: string | null): boolean {
  return !id || id.startsWith('local-') || id === '1' || id === '2' || !id.includes('-');
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

const TIER_NUMBER_WORDS = [
  'Zero',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
];

/** `tier_1` / `tier1` → "Tier One". */
export function formatTierLabel(tier: string): string {
  const num = tier.replace(/\D/g, '');
  if (num) return `Tier ${TIER_NUMBER_WORDS[Number(num)] ?? num}`;
  return tier
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export function formatTierSubtitle(tier: MarketplaceTier): string {
  /** Installed, or paid but uninstalled (`subscribed`) — owned, so show the tier name, not the price. */
  if (tier.is_installed || tier.status === 'installed' || tier.status === 'subscribed') {
    return tier.name?.trim() || 'Purchased';
  }
  if (tier.is_free) return 'FREE';
  if (tier.price != null) {
    return formatKoboAmount(tier.price, { currency: tier.currency_code });
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

/** Refetch the AI Store list/details after a purchase, install, uninstall, cancel or rating. */
export function invalidateMarketplace(): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: queryKeys.marketplace.all });
}

/**
 * List marketplace products for the caller's estate.
 * Powers AI Store list + resolving the product behind "Choose Subscription Plan".
 */
export async function getMarketplaceFeatures(
  params?: MarketplaceListParams
): Promise<MarketplaceListResponse> {
  const path = `/ai-marketplace${buildMarketplaceQuery(params)}`;
  try {
    const response = await Api('ai').get(path);
    return response.data;
  } catch (error: unknown) {
    raiseApiError(error, 'Failed to fetch AI marketplace features');
  }
}

/**
 * Return one marketplace product with child tiers and estate grant status.
 * Drives the "Choose Subscription Plan" tier cards on Preview.
 */
export async function getMarketplaceFeatureById(id: string): Promise<MarketplaceDetailResponse> {
  const path = `/ai-marketplace/${encodeURIComponent(id)}`;
  try {
    const response = await Api('ai').get(path);
    return response.data;
  } catch (error: unknown) {
    raiseApiError(error, 'Failed to fetch feature details');
  }
}

/**
 * Subscribe the estate to a child ai_feature tier of this product.
 */
export async function subscribeMarketplaceFeature(
  id: string,
  payload: SubscribeRequest
): Promise<SubscribeResponse> {
  requirePrimaryAdminForFeatureAction();
  const path = `/ai-marketplace/${encodeURIComponent(id)}/subscribe`;
  try {
    const api = Api('ai');
    const response = await api.post(path, payload);
    void invalidateMarketplace();
    return response.data;
  } catch (error: unknown) {
    throwFeatureActionError(error, 'Failed to subscribe to feature');
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
    void invalidateMarketplace();
    return response.data;
  } catch (error: unknown) {
    raiseApiError(error, 'Failed to submit rating');
  }
}

/**
 * Re-enable an AI feature grant the estate already owns (e.g. after Uninstall).
 * Revenue: POST /ai-features/estate/{estate_id}/install — only creates a grant for free features.
 */
export async function installMarketplaceFeature(
  estateId: string,
  featureKey: string
): Promise<void> {
  requirePrimaryAdminForFeatureAction();
  try {
    const api = Api('revenue');
    await api.post(`/ai-features/estate/${encodeURIComponent(estateId)}/install`, {
      feature_key: featureKey,
    });
    void invalidateMarketplace();
  } catch (error: unknown) {
    throwFeatureActionError(error, 'Failed to install feature');
  }
}

/**
 * Cancel the estate's Paystack AI subscription auto-renew via standalone AI cancellation endpoint.
 * Revenue: POST /ai-features/estate/{estate_id}/cancel
 */
export async function cancelMarketplaceSubscription(
  estateId: string,
  featureKey?: string
): Promise<void> {
  try {
    const api = Api('revenue');
    const body = featureKey ? { feature_key: featureKey } : {};
    await api.post(`/ai-features/estate/${encodeURIComponent(estateId)}/cancel`, body);
    void invalidateMarketplace();
  } catch (error: unknown) {
    if (isAxiosError(error) && error.response?.status === 403) {
      throw new Error(
        "Only the primary admin can cancel an AI subscription. Please contact your estate's primary admin."
      );
    }
    raiseApiError(error, 'Failed to cancel subscription');
  }
}

/**
 * Helper to build display picture URL from GCS object path.
 */
export function getFeaturePictureUrl(path: string): string {
  const baseUrl = process.env.EXPO_PUBLIC_AI_SERVICE_API_URL || '';
  return `${baseUrl}/api/v1/ai-marketplace/picture?path=${encodeURIComponent(path)}`;
}

/**
 * Uninstall an AI feature via the revenue service.
 */
export async function uninstallAiFeature(estateId: string, featureKey: string): Promise<void> {
  requirePrimaryAdminForFeatureAction();
  try {
    const api = Api('revenue');
    await api.post(`/ai-features/estate/${encodeURIComponent(estateId)}/uninstall`, {
      feature_key: featureKey,
    });
    void invalidateMarketplace();
  } catch (error: unknown) {
    throwFeatureActionError(error, 'Failed to uninstall feature');
  }
}

/** CQ-08: alias — same as `uninstallAiFeature`. */
export async function uninstallMarketplaceFeature(
  estateId: string,
  featureKey: string
): Promise<void> {
  return uninstallAiFeature(estateId, featureKey);
}

export async function installAiFeature(estateId: string, featureKey: string): Promise<void> {
  requirePrimaryAdminForFeatureAction();
  try {
    const api = Api('revenue');
    await api.post(`/ai-features/estate/${encodeURIComponent(estateId)}/install`, {
      feature_key: featureKey,
    });
    void invalidateMarketplace();
  } catch (error: unknown) {
    throwFeatureActionError(error, 'Failed to install feature');
  }
}

/**
 * Fetch prorated quote for standalone AI feature purchase.
 * Revenue: POST /checkout/ai/quote
 */
export async function getAiQuote(payload: AiQuoteRequest): Promise<AiQuoteResponse> {
  try {
    const response = await Api('revenue').post('/checkout/ai/quote', payload);
    return response.data;
  } catch (error: unknown) {
    throw toBillingError(error, 'Failed to fetch AI subscription quote');
  }
}
