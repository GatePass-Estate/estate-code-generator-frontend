import { useQuery } from '@tanstack/react-query';
import { estateEntitlementsQuery, myTierQuery } from '@/src/features/billing/services/entitlements';
import { useUserStore } from '@/src/store/userStore';

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
