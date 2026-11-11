import { keepPreviousData, useMutation, useQueries, useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { queryClient } from '@/lib/queryClient';
import {
  cancelSeatReduction,
  cancelSubscription,
  cancelTierChange,
  getBillingCycle,
  getCheckoutQuote,
  getCheckoutStatus,
  getEstateAiGrants,
  getEstateSubscription,
  getSeatProrate,
  getRenewalEligibility,
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
  sortTiers,
} from '@/src/lib/billing';
import { buildStandaloneAiTools } from '@/src/lib/estateAiTools';
import { useUserStore } from '@/src/lib/stores/userStore';
import {
  BillingTier,
  BillingTierListResponse,
  CheckoutQuote,
  CheckoutQuoteRequest,
  CheckoutStatusResponse,
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
  renewalEligibility: (estateId: string) => ['billing', 'renewal-eligibility', estateId] as const,
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

/** Drop every cached billing response (on sign-out, so the next account never sees stale plans). */
export function clearBillingData() {
  queryClient.removeQueries({ queryKey: billingKeys.all });
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
    // The plan can change outside the app (payment webhook, admin tools): refetch on every visit.
    refetchOnMount: 'always',
  });
}

export function useBillingCycle() {
  const { estateId, canView } = useBillingAccess();
  return useQuery({
    queryKey: billingKeys.cycle(estateId ?? ''),
    queryFn: () => getBillingCycle(estateId as string),
    enabled: Boolean(estateId) && canView,
    refetchOnMount: 'always',
  });
}

function resolveQuoteBody(
  params: BillingQuoteParams | null,
  estateId: string | null
): CheckoutQuoteRequest | null {
  const resolvedEstateId = params?.estate_id ?? estateId;
  return params && resolvedEstateId ? { ...params, estate_id: resolvedEstateId } : null;
}

/** Price quote; disabled while `params` is null. Keeps the last quote while new params load. */
export function useBillingQuote(params: BillingQuoteParams | null) {
  const { estateId, canView } = useBillingAccess();
  const body = resolveQuoteBody(params, estateId);
  return useQuery({
    queryKey: billingKeys.quote(body ?? ({} as CheckoutQuoteRequest)),
    queryFn: () => getCheckoutQuote(body as CheckoutQuoteRequest),
    enabled: body !== null && canView,
    placeholderData: body ? keepPreviousData : undefined,
  });
}

/** Warms the `useBillingQuote` cache for `params` (same key and fetcher); no-op when not allowed. */
export function usePrefetchBillingQuote() {
  const { estateId, canView } = useBillingAccess();
  return useCallback(
    (params: BillingQuoteParams | null) => {
      const body = canView ? resolveQuoteBody(params, estateId) : null;
      if (!body) return;
      void queryClient.prefetchQuery({
        queryKey: billingKeys.quote(body),
        queryFn: () => getCheckoutQuote(body),
      });
    },
    [estateId, canView]
  );
}

const combineSeatPrices = (results: { data?: CheckoutQuote }[]): Record<string, TierSeatPrice> => {
  const prices: Record<string, TierSeatPrice> = {};
  for (const { data } of results) {
    if (data?.tier_slug) {
      prices[data.tier_slug] = { pricePerSeat: data.price_per_seat, currency: data.currency_code };
    }
  }
  return prices;
};

/**
 * Per-seat monthly price for each paid, non-custom tier (one quote each: 1 seat, 1 month), keyed
 * by slug. A slug is missing until its quote loads (or if it failed).
 *
 * These share `useBillingQuote`'s cache key (e.g. Choose Plan at 1 seat / 30 days), so the cached
 * value must stay the full quote; the per-seat price is derived in `combine`.
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
        queryFn: () => getCheckoutQuote(body),
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

/** Whether the estate may renew manually (`can_renew`) and why not (auto-renew on, too early, …). */
export function useRenewalEligibility({ enabled = true }: { enabled?: boolean } = {}) {
  const { estateId, canView } = useBillingAccess();
  return useQuery({
    queryKey: billingKeys.renewalEligibility(estateId ?? ''),
    queryFn: () => getRenewalEligibility(estateId as string),
    enabled: enabled && Boolean(estateId) && canView,
    refetchOnMount: 'always',
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
 * The estate's standalone AI subscriptions for Billing's "Active AI Tools": AI tools subscribed to
 * separately from the estate plan, which are managed (and cancelled) in the AI marketplace. AI
 * tools included in the plan and free installs are left out. Named via the AI marketplace
 * (fallback: humanised feature key). See `buildStandaloneAiTools`.
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
  const tools = useMemo(() => buildStandaloneAiTools(grants, products), [grants, products]);

  const { refetch: refetchGrants } = grantsQuery;
  const { refetch: refetchMarketplace } = marketplaceQuery;

  return {
    tools,
    activeCount: tools.filter((tool) => tool.status === 'active').length,
    isLoading: grantsQuery.isLoading || marketplaceQuery.isLoading,
    error: grantsQuery.error ?? null,
    refetch: () => Promise.all([refetchGrants(), refetchMarketplace()]),
  };
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

/** `mutate()` — cancel the plan (no auto-renew; it runs until period_end). */
export function useCancelSubscription() {
  const { estateId } = useBillingAccess();
  return useMutation({
    mutationFn: () => cancelSubscription(requireEstateId(estateId)),
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
