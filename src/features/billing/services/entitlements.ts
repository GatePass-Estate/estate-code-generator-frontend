import { isAxiosError } from 'axios';
import Api from '@/src/shared/services/api/client';
import { queryClient } from '@/src/shared/services/api/queryClient';
import { queryKeys } from '@/src/shared/services/api/queryKeys';
import { Entitlements, parseEntitlements } from '@/src/features/billing/utils/plans';
import { EstateEntitlementsResponse } from '@/src/features/billing/types/entitlements';
import { BillingTier } from '@/src/features/billing/types/billing';
import { EntitlementsDeniedError } from '@/src/features/billing/utils/planAvailability';
import { getErrorMessage } from '@/src/shared/utils/helpers';

export { EntitlementsDeniedError };

/**
 * How long a cached plan counts as current. The plan can change on another device (the paying
 * admin upgrades), so plan-gated screens refetch on mount after this, and `useEstatePlanFreshness`
 * refreshes on app resume.
 */
export const PLAN_STALE_MS = 60_000;

/** A 403 stays an `EntitlementsDeniedError` (e.g. ID not approved), so it never reads as "free". */
function planRequestError(error: unknown, fallback: string): Error {
  const message = getErrorMessage(error) || fallback;
  if (isAxiosError(error) && error.response?.status === 403) {
    return new EntitlementsDeniedError(message);
  }
  return new Error(message);
}

// A refusal won't change on retry; other failures keep the client default of 2 retries.
const retryUnlessDenied = (failureCount: number, error: Error) =>
  !(error instanceof EntitlementsDeniedError) && failureCount < 2;

async function fetchEstateEntitlements(estateId: string): Promise<Entitlements> {
  try {
    const { data } = await Api('revenue').get<EstateEntitlementsResponse>(
      `/entitlements/estate/${estateId}`
    );
    return parseEntitlements(data);
  } catch (error) {
    throw planRequestError(error, 'Could not load plan entitlements');
  }
}

export const estateEntitlementsQuery = (estateId: string) => ({
  queryKey: queryKeys.entitlements.estate(estateId),
  queryFn: () => fetchEstateEntitlements(estateId),
  staleTime: PLAN_STALE_MS,
  retry: retryUnlessDenied,
});

/** The caller's estate tier (any role); `null` when the estate has no running subscription. */
async function fetchMyTier(): Promise<BillingTier | null> {
  try {
    const { data } = await Api('revenue').get<BillingTier | null>('/subscriptions/tiers/my-tier');
    return data ?? null;
  } catch (error) {
    throw planRequestError(error, 'Could not load plan details');
  }
}

// Keyed by estate because the server resolves the tier from the caller's token.
export const myTierQuery = (estateId: string) => ({
  queryKey: queryKeys.entitlements.tier(estateId),
  queryFn: fetchMyTier,
  staleTime: PLAN_STALE_MS,
  retry: retryUnlessDenied,
});

/** Call right after sign-in so plan checks are ready before the user taps anything. */
export function prefetchEstateEntitlements(estateId: string | null | undefined) {
  if (!estateId) return;
  void queryClient.prefetchQuery(estateEntitlementsQuery(estateId));
  void queryClient.prefetchQuery(myTierQuery(estateId));
}

/**
 * Cached entitlements, or the in-flight/fresh fetch when the cache is still empty — so a plan
 * check made right after sign-in waits for the real answer instead of denying by default.
 */
export function ensureEstateEntitlements(estateId: string): Promise<Entitlements> {
  return queryClient.ensureQueryData(estateEntitlementsQuery(estateId));
}

/**
 * Refetches the entitlements and the tier in the background if either cached copy is older than
 * `maxAgeMs` (or failed); never blocks.
 */
export function refreshEstateEntitlementsIfOlderThan(estateId: string, maxAgeMs: number) {
  void queryClient.prefetchQuery({ ...estateEntitlementsQuery(estateId), staleTime: maxAgeMs });
  void queryClient.prefetchQuery({ ...myTierQuery(estateId), staleTime: maxAgeMs });
}

/**
 * Fetches the estate's entitlements from the server now, ignoring how fresh the cache is, and
 * stores the answer. For confirming a cached "no" before refusing the user.
 */
export function refetchEstateEntitlements(estateId: string): Promise<Entitlements> {
  return queryClient.fetchQuery({
    ...estateEntitlementsQuery(estateId),
    staleTime: 0,
    retry: false,
  });
}

/**
 * Refetches the entitlements and the tier (both live under `queryKeys.entitlements.all`). Call when the
 * plan may have changed: a billing action, a server rejection the cache said was allowed, an ID
 * approval. Resolves once the refetch has finished.
 */
export function refreshEstateEntitlements(): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: queryKeys.entitlements.all });
}

export function clearEstateEntitlements() {
  queryClient.removeQueries({ queryKey: queryKeys.entitlements.all });
}
