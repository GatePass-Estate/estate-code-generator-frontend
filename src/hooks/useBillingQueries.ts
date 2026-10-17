import { keepPreviousData, useMutation, useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { queryClient } from '@/lib/queryClient';
import {
  cancelSeatReduction,
  cancelTierChange,
  getBillingCycle,
  getCheckoutQuote,
  getCheckoutStatus,
  getEstateAiGrants,
  getEstateSubscription,
  getSeatProrate,
  getSeatReductionEligibility,
  getSubscriptionTiers,
  initializeCheckout,
  scheduleSeatReduction,
  scheduleTierChange,
} from '@/src/lib/api/billing';
import { getMarketplaceFeatures } from '@/src/lib/api/aiMarketplace';
import { refreshEstateEntitlements } from '@/src/lib/api/entitlements';
import {
  canManageBilling,
  canViewBilling,
  createIdempotencyKey,
  humaniseFeatureKey,
  sortTiers,
} from '@/src/lib/billing';
import { useUserStore } from '@/src/lib/stores/userStore';
import {
  BillingTier,
  BillingTierListResponse,
  CheckoutQuoteRequest,
  CheckoutStatusResponse,
  EstateAiTool,
  InitializeCheckoutRequest,
  TierSeatPrice,
} from '@/src/types/billing';

/** Quote params; `estate_id` defaults to the signed-in user's estate. */
export type BillingQuoteParams = Omit<CheckoutQuoteRequest, 'estate_id'> & { estate_id?: string };

/** Checkout body; `estate_id`/`customer_email` default to the signed-in user, key is generated. */
export type InitializeCheckoutParams = Omit<
  InitializeCheckoutRequest,
  'estate_id' | 'customer_email'
> & {
  estate_id?: string;
  customer_email?: string;
  idempotencyKey?: string;
};

export const billingKeys = {
  all: ['billing'] as const,
  tiers: () => ['billing', 'tiers'] as const,
  subscription: (estateId: string) => ['billing', 'subscription', estateId] as const,
  cycle: (estateId: string) => ['billing', 'cycle', estateId] as const,
  quote: (params: CheckoutQuoteRequest) => ['billing', 'quote', params] as const,
  seatEligibility: (estateId: string) => ['billing', 'seat-eligibility', estateId] as const,
  seatProrate: (estateId: string, seatsAdded: number) =>
    ['billing', 'seat-prorate', estateId, seatsAdded] as const,
  aiGrants: (estateId: string) => ['billing', 'ai-grants', estateId] as const,
  aiMarketplace: (estateId: string) => ['billing', 'ai-marketplace', estateId] as const,
};

/** Refetch every billing query and the estate's entitlements (after a plan/seat change or payment). */
export function refreshBillingData(): Promise<void> {
  refreshEstateEntitlements();
  return queryClient.invalidateQueries({ queryKey: billingKeys.all });
}

/** Signed-in user's billing permissions. Admin-only queries stay disabled unless `canView`. */
export function useBillingAccess() {
  const role = useUserStore((s) => s.role);
  const estateId = useUserStore((s) => s.estate_id);
  const email = useUserStore((s) => s.email);
  return {
    role,
    canView: canViewBilling(role),
    canManage: canManageBilling(role),
    estateId,
    email,
  };
}

// Stable reference so React Query memoises the sorted array between renders.
const selectSortedTiers = (data: BillingTierListResponse): BillingTier[] =>
  sortTiers(data.items ?? []);

/** Tier catalog sorted by `display_order`. */
export function useBillingTiers() {
  const { canView } = useBillingAccess();
  return useQuery({
    queryKey: billingKeys.tiers(),
    queryFn: () => getSubscriptionTiers({ page: 1, limit: 20, is_active: true }),
    select: selectSortedTiers,
    enabled: canView,
  });
}

/** `{subscription, tier, ...}` for the estate; `subscription`/`tier` are null when it has none. */
export function useEstateSubscription() {
  const { estateId, canView } = useBillingAccess();
  return useQuery({
    queryKey: billingKeys.subscription(estateId ?? ''),
    queryFn: () => getEstateSubscription(estateId as string),
    enabled: Boolean(estateId) && canView,
  });
}

export function useBillingCycle() {
  const { estateId, canView } = useBillingAccess();
  return useQuery({
    queryKey: billingKeys.cycle(estateId ?? ''),
    queryFn: () => getBillingCycle(estateId as string),
    enabled: Boolean(estateId) && canView,
  });
}

/** Price quote; disabled while `params` is null. Keeps the last quote while new params load. */
export function useBillingQuote(params: BillingQuoteParams | null) {
  const { estateId, canView } = useBillingAccess();
  const resolvedEstateId = params?.estate_id ?? estateId;
  const body: CheckoutQuoteRequest | null =
    params && resolvedEstateId ? { ...params, estate_id: resolvedEstateId } : null;
  return useQuery({
    queryKey: billingKeys.quote(body ?? ({} as CheckoutQuoteRequest)),
    queryFn: () => getCheckoutQuote(body as CheckoutQuoteRequest),
    enabled: body !== null && canView,
    placeholderData: body ? keepPreviousData : undefined,
  });
}

type SeatPriceResult = { slug: string } & TierSeatPrice;

const combineSeatPrices = (
  results: { data?: SeatPriceResult }[]
): Record<string, TierSeatPrice> => {
  const prices: Record<string, TierSeatPrice> = {};
  for (const { data } of results) {
    if (data) prices[data.slug] = { pricePerSeat: data.pricePerSeat, currency: data.currency };
  }
  return prices;
};

/**
 * Per-seat monthly price for each paid, non-custom tier (one quote each: 1 seat, 1 month), keyed
 * by slug. A slug is missing until its quote loads (or if it failed).
 */
export function useTierSeatPrices(
  tiers: readonly BillingTier[] | null | undefined
): Record<string, TierSeatPrice> {
  const { estateId, canView } = useBillingAccess();
  const paidTiers = (tiers ?? []).filter((tier) => !tier.is_custom && tier.slug !== 'access');
  return useQueries({
    queries: paidTiers.map((tier) => {
      const body: CheckoutQuoteRequest = {
        estate_id: estateId ?? '',
        tier_slug: tier.slug,
        covered_users: 1,
        period_months: 1,
      };
      return {
        queryKey: billingKeys.quote(body),
        queryFn: async (): Promise<SeatPriceResult> => {
          const quote = await getCheckoutQuote(body);
          return {
            slug: tier.slug,
            pricePerSeat: quote.price_per_seat,
            currency: quote.currency_code,
          };
        },
        enabled: Boolean(estateId) && canView,
      };
    }),
    combine: combineSeatPrices,
  });
}

/** `null` data when the subscription isn't active/trialing (the API answers 404). */
export function useSeatReductionEligibility() {
  const { estateId, canView } = useBillingAccess();
  return useQuery({
    queryKey: billingKeys.seatEligibility(estateId ?? ''),
    queryFn: () => getSeatReductionEligibility(estateId as string),
    enabled: Boolean(estateId) && canView,
  });
}

/** Prorated charge for adding `seatsAdded` seats now; disabled unless `seatsAdded >= 1`. */
export function useSeatProrate(seatsAdded: number | null) {
  const { estateId, canView } = useBillingAccess();
  const seats = seatsAdded ?? 0;
  return useQuery({
    queryKey: billingKeys.seatProrate(estateId ?? '', seats),
    queryFn: () => getSeatProrate({ estate_id: estateId as string, seats_added: seats }),
    enabled: Boolean(estateId) && canView && seats >= 1,
    placeholderData: keepPreviousData,
  });
}

/**
 * The estate's AI grants named via the AI marketplace (fallback: humanised feature key).
 * `totalCount` is the marketplace product total (0 until it loads or if it fails).
 */
export function useEstateAiTools() {
  const { estateId, canView } = useBillingAccess();
  const enabled = Boolean(estateId) && canView;

  const grantsQuery = useQuery({
    queryKey: billingKeys.aiGrants(estateId ?? ''),
    queryFn: () => getEstateAiGrants(estateId as string),
    enabled,
  });
  const marketplaceQuery = useQuery({
    queryKey: billingKeys.aiMarketplace(estateId ?? ''),
    queryFn: () => getMarketplaceFeatures({ page: 1, limit: 100 }),
    enabled,
  });

  const grants = grantsQuery.data?.features;
  const products = marketplaceQuery.data?.items;
  // One row per tool: a product's tiers (e.g. tier_1 + tier_2 from the Command plan) are separate
  // grants, so group them and keep the most relevant grant (active first, then latest expiry).
  const tools = useMemo<EstateAiTool[]>(() => {
    const productByFeatureId = new Map<string, { id: string; name: string }>();
    for (const product of products ?? []) {
      for (const featureId of product.ai_feature_ids ?? [])
        productByFeatureId.set(featureId, { id: product.id, name: product.name });
    }
    const byTool = new Map<string, EstateAiTool>();
    for (const grant of grants ?? []) {
      const product = productByFeatureId.get(grant.ai_feature_id);
      const name = product?.name || humaniseFeatureKey(grant.feature_key) || 'AI tool';
      const tool: EstateAiTool = {
        featureKey: grant.feature_key ?? '',
        name,
        status: grant.status,
        startsAt: grant.starts_at,
        expiresAt: grant.expires_at,
      };
      const groupKey = product?.id ?? name;
      const existing = byTool.get(groupKey);
      if (!existing || isMoreRelevantGrant(tool, existing)) byTool.set(groupKey, tool);
    }
    return Array.from(byTool.values());
  }, [grants, products]);

  const { refetch: refetchGrants } = grantsQuery;
  const { refetch: refetchMarketplace } = marketplaceQuery;

  return {
    tools,
    activeCount: tools.filter((tool) => tool.status === 'active').length,
    totalCount: marketplaceQuery.data?.total ?? 0,
    isLoading: grantsQuery.isLoading || marketplaceQuery.isLoading,
    error: grantsQuery.error ?? null,
    refetch: () => Promise.all([refetchGrants(), refetchMarketplace()]),
  };
}

function isMoreRelevantGrant(candidate: EstateAiTool, current: EstateAiTool): boolean {
  const candidateActive = candidate.status === 'active';
  if (candidateActive !== (current.status === 'active')) return candidateActive;
  // A missing expiry means a free install that never expires.
  const expiry = (tool: EstateAiTool) =>
    tool.expiresAt ? new Date(tool.expiresAt).getTime() : Number.POSITIVE_INFINITY;
  return expiry(candidate) > expiry(current);
}

function requireEstateId(estateId: string | null): string {
  if (!estateId) throw new Error('Missing estate details. Pull to refresh and try again.');
  return estateId;
}

/** `mutate(tierSlug)` — schedule a plan change for the next billing cycle. */
export function useScheduleTierChange() {
  const { estateId } = useBillingAccess();
  return useMutation({
    mutationFn: (tierSlug: string) => scheduleTierChange(requireEstateId(estateId), tierSlug),
    onSuccess: () => refreshBillingData(),
  });
}

/** `mutate()` — cancel the scheduled plan change. */
export function useCancelTierChange() {
  const { estateId } = useBillingAccess();
  return useMutation({
    mutationFn: () => cancelTierChange(requireEstateId(estateId)),
    onSuccess: () => refreshBillingData(),
  });
}

/** `mutate(seats)` — schedule a lower seat count for the next billing cycle. */
export function useScheduleSeatReduction() {
  const { estateId } = useBillingAccess();
  return useMutation({
    mutationFn: (seats: number) => scheduleSeatReduction(requireEstateId(estateId), seats),
    onSuccess: () => refreshBillingData(),
  });
}

/** `mutate()` — cancel the scheduled seat reduction. */
export function useCancelSeatReduction() {
  const { estateId } = useBillingAccess();
  return useMutation({
    mutationFn: () => cancelSeatReduction(requireEstateId(estateId)),
    onSuccess: () => refreshBillingData(),
  });
}

/**
 * `mutateAsync(params)` → `{checkout_session_id, paystack_reference, authorization_url,
 * checkout_token}`. Nothing has changed server-side until payment succeeds, so this does not
 * refresh billing data — call `refreshBillingData()` once `fetchCheckoutStatus` reports `paid`.
 */
export function useInitializeCheckout() {
  const { estateId, email } = useBillingAccess();
  return useMutation({
    mutationFn: ({ idempotencyKey, ...params }: InitializeCheckoutParams) => {
      const customerEmail = params.customer_email ?? email;
      if (!customerEmail) {
        throw new Error('Add an email address to your profile before paying.');
      }
      return initializeCheckout(
        {
          ...params,
          estate_id: params.estate_id ?? requireEstateId(estateId),
          customer_email: customerEmail,
        },
        idempotencyKey ?? createIdempotencyKey()
      );
    },
  });
}

/** Poll target for a Paystack checkout started with `useInitializeCheckout`. */
export function fetchCheckoutStatus(
  reference: string,
  token: string
): Promise<CheckoutStatusResponse> {
  return getCheckoutStatus(reference, token);
}
