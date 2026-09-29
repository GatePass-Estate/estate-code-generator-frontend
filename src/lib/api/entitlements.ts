import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import Api from '.';
import { queryClient } from '@/lib/queryClient';
import { useUserStore } from '@/src/lib/stores/userStore';
import { Entitlements, parseEntitlements } from '@/src/lib/plans';
import { EstateEntitlementsResponse } from '@/src/types/entitlements';
import { getErrorMessage } from '../helpers';

const entitlementKeys = {
  all: ['entitlements'] as const,
  estate: (estateId: string) => ['entitlements', 'estate', estateId] as const,
};

/**
 * The revenue service refused to share the estate's plan with this user (403) — e.g. their ID
 * isn't approved yet. `message` is the server's reason, worth showing as-is: unlike a network
 * failure, this says nothing about what the plan includes.
 */
export class EntitlementsDeniedError extends Error {}

async function fetchEstateEntitlements(estateId: string): Promise<Entitlements> {
  try {
    const { data } = await Api('revenue').get<EstateEntitlementsResponse>(
      `/entitlements/estate/${estateId}`
    );
    return parseEntitlements(data);
  } catch (error: any) {
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

/** Call right after sign-in so plan checks are ready before the user taps anything. */
export function prefetchEstateEntitlements(estateId: string | null | undefined) {
  if (!estateId) return;
  void queryClient.prefetchQuery(estateEntitlementsQuery(estateId));
}

/**
 * Cached entitlements, or the in-flight/fresh fetch when the cache is still empty — so a plan
 * check made right after sign-in waits for the real answer instead of denying by default.
 */
export function ensureEstateEntitlements(estateId: string): Promise<Entitlements> {
  return queryClient.ensureQueryData(estateEntitlementsQuery(estateId));
}

/** Refetches in the background if the cached copy is older than `maxAgeMs`; never blocks. */
export function refreshEstateEntitlementsIfOlderThan(estateId: string, maxAgeMs: number) {
  void queryClient.prefetchQuery({ ...estateEntitlementsQuery(estateId), staleTime: maxAgeMs });
}

/** Call when the server rejects a feature the cache said was allowed, so the cache catches up. */
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
