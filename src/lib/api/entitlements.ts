import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import Api from '.';
import { queryClient } from '@/lib/queryClient';
import { useUserStore } from '@/src/lib/stores/userStore';
import { Entitlements, parseEntitlements } from '@/src/lib/plans';
import { EstateEntitlementsResponse } from '@/src/types/entitlements';
import { BillingTier } from '@/src/types/billing';
import { getErrorMessage } from '../helpers';

const entitlementKeys = {
  all: ['entitlements'] as const,
  estate: (estateId: string) => ['entitlements', 'estate', estateId] as const,
  tier: (estateId: string) => ['entitlements', 'tier', estateId] as const,
};

/**
 * The revenue service refused to share the estate's plan with this user (403) — e.g. their ID
 * isn't approved yet. `message` is the server's reason, worth showing as-is: unlike a network
 * failure, this says nothing about what the plan includes.
 */
export class EntitlementsDeniedError extends Error {}

const INCIDENT_ENTITLEMENT_KEYS = [
  'incident_report',
  'incident_report_summary_tier_1',
  'incident_report_summary_tier_2',
  'incident_report_summary_tier_3',
] as const;

async function fetchEstateEntitlements(estateId: string): Promise<Entitlements> {
  try {
    const { data } = await Api('revenue').get<EstateEntitlementsResponse>(
      `/entitlements/estate/${estateId}`
    );
    const parsed = parseEntitlements(data);
    console.log('\n================== [entitlements] estate response ==================');
    console.log(
      JSON.stringify(
        {
          estate_id: data.estate_id,
          locked: data.locked ?? false,
          reason: data.reason ?? null,
          subscription_status: data.subscription_status ?? null,
          tier_slug: data.tier_slug ?? null,
          incident: Object.fromEntries(
            INCIDENT_ENTITLEMENT_KEYS.map((key) => [
              key,
              {
                raw: data.entitlements?.[key] ?? null,
                granted: parsed.services.get(key) ?? false,
              },
            ])
          ),
        },
        null,
        2
      )
    );
    console.log('===================================================================\n');
    return parsed;
  } catch (error: any) {
    if (isAxiosError(error)) {
      console.log('\n================== [entitlements] estate error ==================');
      console.log(
        JSON.stringify(
          {
            status: error.response?.status ?? null,
            data: error.response?.data ?? null,
            message: error.message,
          },
          null,
          2
        )
      );
      console.log('===================================================================\n');
    }
    const message = getErrorMessage(error) || 'Could not load plan entitlements';
    if (isAxiosError(error) && error.response?.status === 403) {
      throw new EntitlementsDeniedError(message);
    }
    throw new Error(message);
  }
}

const estateEntitlementsQuery = (estateId: string) => ({
  queryKey: entitlementKeys.estate(estateId),
  queryFn: () => fetchEstateEntitlements(estateId),
  // A refusal won't change on retry; other failures keep the client default of 2 retries.
  retry: (failureCount: number, error: Error) =>
    !(error instanceof EntitlementsDeniedError) && failureCount < 2,
});

/** The caller's estate tier (any role); `null` when the estate has no running subscription. */
async function fetchMyTier(): Promise<BillingTier | null> {
  try {
    const { data } = await Api('revenue').get<BillingTier | null>('/subscriptions/tiers/my-tier');
    return data ?? null;
  } catch (error: any) {
    throw new Error(getErrorMessage(error) || 'Could not load plan details');
  }
}

// Keyed by estate because the server resolves the tier from the caller's token.
const myTierQuery = (estateId: string) => ({
  queryKey: entitlementKeys.tier(estateId),
  queryFn: fetchMyTier,
  // Kept for the whole session; billing changes refresh it via `refreshEstateEntitlements`.
  staleTime: Infinity,
  gcTime: Infinity,
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
 * Call when the plan may have changed (a payment or upgrade) or the server rejects a feature the
 * cache said was allowed, so the cache catches up. Resolves once the refetch has finished.
 */
export function refreshEstateEntitlements(): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: entitlementKeys.all });
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
