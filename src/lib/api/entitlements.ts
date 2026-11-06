import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import Api from '.';
import { queryClient } from '@/lib/queryClient';
import { useUserStore } from '@/src/lib/stores/userStore';
import { Entitlements, parseEntitlements } from '@/src/lib/plans';
import { EstateEntitlementsResponse } from '@/src/types/entitlements';
import { BillingTier } from '@/src/types/billing';
import { EntitlementsDeniedError } from '@/src/lib/planAvailability';
import { getErrorMessage } from '../helpers';

const entitlementKeys = {
  all: ['entitlements'] as const,
  estate: (estateId: string) => ['entitlements', 'estate', estateId] as const,
  tier: (estateId: string) => ['entitlements', 'tier', estateId] as const,
};

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

const estateEntitlementsQuery = (estateId: string) => ({
  queryKey: entitlementKeys.estate(estateId),
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
const myTierQuery = (estateId: string) => ({
  queryKey: entitlementKeys.tier(estateId),
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
 * Refetches the entitlements and the tier (both live under `entitlementKeys.all`). Call when the
 * plan may have changed: a billing action, a server rejection the cache said was allowed, an ID
 * approval.
 */
export function refreshEstateEntitlements() {
  void queryClient.invalidateQueries({ queryKey: entitlementKeys.all });
}

export function clearEstateEntitlements() {
  queryClient.removeQueries({ queryKey: entitlementKeys.all });
}

/** Signed-in user's estate plan and entitlements. */
export function useEstateEntitlements() {
  const estateId = useUserStore((s) => s.estate_id);
  return useQuery({
    ...estateEntitlementsQuery(estateId ?? ''),
    enabled: Boolean(estateId),
  });
}

/** Catalog details (name, description) of the signed-in estate's current tier. */
export function useEstateTier() {
  const estateId = useUserStore((s) => s.estate_id);
  return useQuery({ ...myTierQuery(estateId ?? ''), enabled: Boolean(estateId) });
}
