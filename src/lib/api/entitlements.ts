import { useQuery } from '@tanstack/react-query';
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

async function fetchEstateEntitlements(estateId: string): Promise<Entitlements> {
  try {
    const { data } = await Api('revenue').get<EstateEntitlementsResponse>(
      `/entitlements/estate/${estateId}`
    );
    return parseEntitlements(data);
  } catch (error: any) {
    throw new Error(`${getErrorMessage(error) || 'Could not load plan entitlements'}`);
  }
}

const estateEntitlementsQuery = (estateId: string) => ({
  queryKey: entitlementKeys.estate(estateId),
  queryFn: () => fetchEstateEntitlements(estateId),
});

/** Call right after sign-in so plan checks are ready before the user taps anything. */
export function prefetchEstateEntitlements(estateId: string | null | undefined) {
  if (!estateId) return;
  void queryClient.prefetchQuery(estateEntitlementsQuery(estateId));
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
