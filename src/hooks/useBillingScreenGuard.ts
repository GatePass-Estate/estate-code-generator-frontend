import { useEffect } from 'react';
import { router } from 'expo-router';
import { useBillingAccess, useEstateSubscription } from '@/src/hooks/useBillingQueries';
import { getBillingEntry } from '@/src/lib/billing';

/**
 * Shared redirects for the billing screens:
 * - users who can't view billing go back to their More screen (once their role is known);
 * - with `requirePaidPlan`, estates without a running paid plan go to "Choose your plan"
 *   (Choose Plan itself never redirects onwards, so this cannot loop).
 * `redirecting` is true while either redirect is pending or the role is still loading, so the
 * screen should render its loading state.
 */
export function useBillingScreenGuard({
  requirePaidPlan = false,
}: { requirePaidPlan?: boolean } = {}) {
  const access = useBillingAccess();
  const subscriptionQuery = useEstateSubscription();
  const { role, canView } = access;

  // `role` is null until the signed-in user loads; only redirect once we know it.
  const denied = Boolean(role) && !canView;
  const data = subscriptionQuery.data;
  const entry = data ? getBillingEntry(data.subscription, data.tier) : null;
  const needsPlan = requirePaidPlan && entry === 'choose';

  useEffect(() => {
    if (denied) router.replace(role === 'security' ? '/security/more' : '/settings');
  }, [denied, role]);

  useEffect(() => {
    if (needsPlan) router.replace('/billing/choose-plan');
  }, [needsPlan]);

  return {
    ...access,
    subscriptionQuery,
    subscription: data?.subscription ?? null,
    tier: data?.tier ?? null,
    entry,
    redirecting: !canView || needsPlan,
  };
}
