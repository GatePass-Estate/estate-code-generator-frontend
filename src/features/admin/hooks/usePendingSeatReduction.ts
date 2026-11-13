import { useEstateEntitlements } from '@/src/features/billing/hooks/entitlements';
import { useEstateSubscription } from '@/src/features/billing/hooks/billing';
import { isSeatReductionPending } from '@/src/features/admin/utils/seatReduction';

/** Whether a scheduled seat reduction blocks adding users (same rule on web and native). */
export function usePendingSeatReduction(): boolean {
  const { data: estateEntitlements } = useEstateEntitlements();
  const { data: subscriptionData } = useEstateSubscription();
  const subscription = subscriptionData?.subscription;
  return isSeatReductionPending({
    capacity: estateEntitlements?.coveredUsers ?? subscription?.covered_users ?? null,
    pendingCoveredUsers: subscription?.pending_covered_users ?? null,
    reason: estateEntitlements?.reason,
  });
}
