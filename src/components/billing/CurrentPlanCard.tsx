import PlanCard from '@/src/components/billing/PlanCard';
import { useBillingQuote } from '@/src/hooks/useBillingQueries';
import {
  FREE_PLAN_FOOTNOTE,
  formatMonthlyCharge,
  getCurrentPlanQuoteParams,
  getCurrentPlanState,
  getPlanExpiredFootnote,
  getPlanRenewalFootnote,
} from '@/src/lib/billing';
import type { BillingTier, EstateSubscription } from '@/src/types/billing';

const EYEBROW = 'Your Current Plan';

/**
 * "Your Current Plan" banner (Current Plan + Manage Seats).
 * - Running paid plan: what the estate is charged per month (1-month quote of the current plan at
 *   its seat count, VAT included) and the renew/expiry date.
 * - Free Access plan (or no plan at all): the Access card, 'Free', and an upgrade hint.
 * - Paid plan that has ended: the greyed "Your Previous Plan" card with that monthly price and its
 *   expiry date.
 */
export default function CurrentPlanCard({
  subscription,
  tier,
  className,
}: {
  subscription: EstateSubscription | null;
  tier: BillingTier | null;
  className?: string;
}) {
  const state = getCurrentPlanState(subscription, tier);
  // A paid plan (running or ended) shows its monthly charge at the seats it covers.
  const { data: quote } = useBillingQuote(
    state === 'free'
      ? null
      : getCurrentPlanQuoteParams(subscription, tier, subscription?.covered_users ?? 0, 1)
  );
  const priceLabel = formatMonthlyCharge(quote);

  if (state === 'free') {
    return (
      <PlanCard
        className={className}
        slug="access"
        name={tier?.slug === 'access' ? tier.name : 'Access'}
        eyebrow={EYEBROW}
        priceLabel="Free"
        footnote={FREE_PLAN_FOOTNOTE}
      />
    );
  }

  // 'paid' and 'expired' always have a tier; the fallbacks only satisfy the types.
  const slug = tier?.slug ?? 'access';
  const name = tier?.name ?? 'Access';

  if (state === 'expired') {
    return (
      <PlanCard
        className={className}
        slug={slug}
        name={name}
        eyebrow="Your Previous Plan"
        priceLabel={priceLabel}
        unitLabel="/month"
        footnote={getPlanExpiredFootnote(subscription)}
        expired
      />
    );
  }

  return (
    <PlanCard
      className={className}
      slug={slug}
      name={name}
      eyebrow={EYEBROW}
      priceLabel={priceLabel}
      unitLabel="/month"
      footnote={getPlanRenewalFootnote(subscription)}
    />
  );
}
